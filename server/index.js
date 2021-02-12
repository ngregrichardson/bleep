require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const audioConcat = require("audioconcat");
const speech = require("@google-cloud/speech");
const extractAudio = require("ffmpeg-extract-audio");
const converter = require("handbrake-js");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);
const MP3Cutter = require("mp3-cutter");
const http = require("http");
const socketIo = require("socket.io");
const Lame = require("node-lame").Lame;
let admin = require("firebase-admin");

let serviceAccount = require(`${__dirname}/${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL,
  storageBucket: process.env.STORAGE_BUCKET,
});

let bucket = admin.storage().bucket();
let db = admin.firestore();
let errorCollection = db.collection("errors");

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/converting/"),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}_${uid()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage: multerStorage });
const multerConfig = upload.fields([
  { name: "video", maxCount: 1 },
  { name: "sfx", maxCount: 1 },
]);

const app = express();

let socketHttp = http.createServer(app);
let io = socketIo(socketHttp);

app.use(cors());
app.use(express.static("../client/build"));

app.set("port", process.env.PORT || 7000);
const server = socketHttp.listen(app.get("port"), () => {
  console.log(`Express running → PORT ${server.address().port}`);
});

app.post("/bleep", multerConfig, (req, res) => {
  let progress = 0;
  let filesToDelete = [];
  let socketId;

  let sfx = { path: "assets/default.mp3", filename: "default.mp3" };
  if (req.files.sfx && req.files.sfx.length > 0) {
    sfx = req.files.sfx[0];
    filesToDelete.push(sfx.path);
  }

  if (!req.files.video || req.files.video.length <= 0) {
    deleteFiles(filesToDelete).then(() => {
      return res
        .status(400)
        .json({ status: 400, message: "Bad request. No video provided." });
    });
  }

  let video = req.files.video[0];
  filesToDelete.push(video.path);

  if (!req.body.socketId || req.body.socketId.trim() === "") {
    deleteFiles(filesToDelete).then(() => {
      return res
        .status(400)
        .json({ status: 400, message: "Could not connect with the socket." });
    });
  } else {
    socketId = req.body.socketId;
  }

  let words = req.body.words;
  if (!words || words.length <= 0) {
    deleteFiles(filesToDelete).then(() => {
      return res.status(400).json({
        status: 400,
        message: "At least one blacklisted word is required.",
      });
    });
  } else {
    words = JSON.parse(words);
  }

  progress += 0.1;
  sendProgress(socketId, progress, "loading", "Uploading files...");

  const videoFilename = video.filename.split(".").slice(-2).shift();
  const audioFilename = sfx.filename.split(".").slice(-2).shift();
  const mp4Path = `uploads/converted/${videoFilename}.mp4`;
  filesToDelete.push(mp4Path);

  converter
    .spawn({
      input: video.path,
      output: mp4Path,
    })
    .on("error", (error) => {
      let errorMessage = "There was a problem converting the video.";
      saveError({
        message: errorMessage,
        timestamp: admin.database.ServerValue.TIMESTAMP,
        error: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        videoFilename,
        audioFilename,
        words,
      }).then((docRef) => {
        deleteFiles(filesToDelete).then(() => {
          return res.status(500).json({
            status: 500,
            message: errorMessage,
            errorRef: docRef ? docRef.id : null,
          });
        });
      });
    })
    .on("progress", () => {
      progress = 0.15;
      sendProgress(socketId, progress, "loading", "Converting video...");
    })
    .on("end", () => {
      let audioPath = `uploads/extracted_audio/${audioFilename}.mp3`;
      filesToDelete.push(audioPath);
      progress = 0.35;
      sendProgress(socketId, progress, "loading", "Extracting audio...");
      extractAudio({ input: mp4Path, output: audioPath })
        .then(() => {
          progress = 0.45;
          sendProgress(socketId, progress, "loading", "Parsing speech...");
          let client = new speech.SpeechClient();
          let file = fs.readFileSync(audioPath);
          let bytes = file.toString("base64");
          let audio = {
            content: bytes,
          };
          let config = {
            encoding: "MP3",
            languageCode: "en-US",
            enableWordTimeOffsets: true,
            sampleRateHertz: 16000,
          };
          let request = {
            audio: audio,
            config: config,
          };
          let transcript = [];
          client
            .recognize(request)
            .then(([response]) => {
              if (response.results.length === 0) {
                return res.status(500).json({
                  status: 500,
                  message: "There were no words found in the video",
                });
              }
              progress = 0.6;
              sendProgress(
                socketId,
                progress,
                "loading",
                "Detecting swears..."
              );
              const result = response.results[0];
              result.alternatives[0].words.forEach((wordInfo) => {
                let start = parseFloat(
                  parseInt(wordInfo.startTime.seconds) +
                    wordInfo.startTime.nanos / 1e9
                );
                let end = parseFloat(
                  parseInt(wordInfo.endTime.seconds) +
                    wordInfo.endTime.nanos / 1e9
                );
                let runTime = end - start;
                for (let word in words) {
                  if (
                    words[word].toLowerCase() === wordInfo.word.toLowerCase()
                  ) {
                    transcript.push({
                      word: wordInfo.word,
                      start,
                      end,
                      runTime,
                    });
                    break;
                  }
                }
              });
              progress = 0.75;
              sendProgress(socketId, progress, "loading", "Removing swears...");
              let clips = [];
              let sfxPath = `uploads/converted/${audioFilename}_${uid()}.mp3`;
              const audioConverter = new Lame({ output: sfxPath }).setFile(
                sfx.path
              );
              audioConverter
                .encode()
                .then(() => {
                  filesToDelete.push(sfxPath);
                  for (let word in transcript) {
                    let beforeClipPath = `uploads/clips/${audioFilename}_${word}_${uid()}_before.mp3`;
                    MP3Cutter.cut({
                      src: audioPath,
                      target: beforeClipPath,
                      start: clips.length === 0 ? 0 : transcript[word - 1].end,
                      end: transcript[word].start,
                    });
                    clips.push(beforeClipPath);
                    filesToDelete.push(beforeClipPath);
                    let swearClipPath = `uploads/clips/${audioFilename}_${word}_${uid()}_swear.mp3`;
                    MP3Cutter.cut({
                      src: sfxPath,
                      target: swearClipPath,
                      start: 0,
                      end: transcript[word].runTime,
                    });
                    clips.push(swearClipPath);
                    filesToDelete.push(swearClipPath);
                  }
                  let lastClipPath = `uploads/clips/${audioFilename}_${uid()}_last.mp3`;
                  MP3Cutter.cut({
                    src: audioPath,
                    target: lastClipPath,
                    start: transcript[transcript.length - 1].end,
                  });
                  clips.push(lastClipPath);
                  filesToDelete.push(lastClipPath);
                  progress = 0.9;
                  sendProgress(
                    socketId,
                    progress,
                    "loading",
                    "Merging audio..."
                  );
                  let mergedPath = `uploads/merged_audio/${audioFilename}_${uid()}.mp3`;
                  filesToDelete.push(mergedPath);
                  audioConcat(clips)
                    .concat(mergedPath)
                    .on("error", (error) => {
                      let errorMessage =
                        "There was a problem merging the audio.";
                      saveError({
                        message: errorMessage,
                        timestamp: admin.database.ServerValue.TIMESTAMP,
                        error: JSON.stringify(
                          error,
                          Object.getOwnPropertyNames(error)
                        ),
                        videoFilename,
                        audioFilename,
                        words,
                      }).then((docRef) => {
                        deleteFiles(filesToDelete).then(() => {
                          return res.status(500).json({
                            status: 500,
                            message: errorMessage,
                            errorRef: docRef ? docRef.id : null,
                          });
                        });
                      });
                    })
                    .on("end", () => {
                      progress = 0.95;
                      sendProgress(
                        socketId,
                        progress,
                        "loading",
                        "Repairing video..."
                      );
                      let silentPath = `uploads/silent/${videoFilename}_silent.mp4`;
                      filesToDelete.push(silentPath);
                      ffmpeg()
                        .addInput(mp4Path)
                        .noAudio()
                        .on("error", (error) => {
                          let errorMessage =
                            "There was a problem repairing the video.";
                          saveError({
                            message: errorMessage,
                            timestamp: admin.database.ServerValue.TIMESTAMP,
                            error: JSON.stringify(
                              error,
                              Object.getOwnPropertyNames(error)
                            ),
                            videoFilename,
                            audioFilename,
                            words,
                          }).then((docRef) => {
                            deleteFiles(filesToDelete).then(() => {
                              return res.status(500).json({
                                status: 500,
                                message: errorMessage,
                                errorRef: docRef ? docRef.id : null,
                              });
                            });
                          });
                        })
                        .on("end", () => {
                          let finalFileName = `${videoFilename}_${uid()}`;
                          let finalPath = `uploads/final/${finalFileName}.mp4`;
                          ffmpeg()
                            .addInput(silentPath)
                            .addInput(mergedPath)
                            .on("error", (error) => {
                              let errorMessage =
                                "There was a problem repairing the video.";
                              saveError({
                                message: errorMessage,
                                timestamp: admin.database.ServerValue.TIMESTAMP,
                                error: JSON.stringify(
                                  error,
                                  Object.getOwnPropertyNames(error)
                                ),
                                videoFilename,
                                audioFilename,
                                words,
                              }).then((docRef) => {
                                deleteFiles(filesToDelete).then(() => {
                                  return res.status(500).json({
                                    status: 500,
                                    message: errorMessage,
                                    errorRef: docRef ? docRef.id : null,
                                  });
                                });
                              });
                            })
                            .on("end", () => {
                              filesToDelete.push(finalPath);
                              let downloadFileName = `downloads/${finalFileName}.mp4`;
                              bucket
                                .upload(finalPath, {
                                  destination: downloadFileName,
                                  contentType: "video/mp4",
                                })
                                .then(() => {
                                  let expires = new Date();
                                  expires.setHours(expires.getHours() + 24);
                                  bucket
                                    .file(downloadFileName)
                                    .getSignedUrl({
                                      action: "read",
                                      expires,
                                      promptSaveAs: "bleep-output.mp4",
                                    })
                                    .then((url) => {
                                      deleteFiles(filesToDelete).then(() => {
                                        return res.status(200).json({
                                          statusCode: 200,
                                          status: "success",
                                          message: "It's f%*king done!",
                                          progress: 1,
                                          url: url[0],
                                        });
                                      });
                                    })
                                    .catch((error) => {
                                      let errorMessage =
                                        "There was a problem saving the video.";
                                      saveError({
                                        message: errorMessage,
                                        timestamp:
                                          admin.database.ServerValue.TIMESTAMP,
                                        error: JSON.stringify(
                                          error,
                                          Object.getOwnPropertyNames(error)
                                        ),
                                        videoFilename,
                                        audioFilename,
                                        words,
                                      }).then((docRef) => {
                                        deleteFiles(filesToDelete).then(() => {
                                          return res.status(500).json({
                                            status: 500,
                                            message: errorMessage,
                                            errorRef: docRef ? docRef.id : null,
                                          });
                                        });
                                      });
                                    });
                                })
                                .catch((error) => {
                                  let errorMessage =
                                    "There was a problem saving the video.";
                                  saveError({
                                    message: errorMessage,
                                    timestamp:
                                      admin.database.ServerValue.TIMESTAMP,
                                    error: JSON.stringify(
                                      error,
                                      Object.getOwnPropertyNames(error)
                                    ),
                                    videoFilename,
                                    audioFilename,
                                    words,
                                  }).then((docRef) => {
                                    deleteFiles(filesToDelete).then(() => {
                                      return res.status(500).json({
                                        status: 500,
                                        message: errorMessage,
                                        errorRef: docRef ? docRef.id : null,
                                      });
                                    });
                                  });
                                });
                            })
                            .save(finalPath);
                        })
                        .save(silentPath);
                    });
                })
                .catch((error) => {
                  let errorMessage =
                    "There was a problem converting the audio.";
                  saveError({
                    message: errorMessage,
                    timestamp: admin.database.ServerValue.TIMESTAMP,
                    error: JSON.stringify(
                      error,
                      Object.getOwnPropertyNames(error)
                    ),
                    videoFilename,
                    audioFilename,
                    words,
                  }).then((docRef) => {
                    deleteFiles(filesToDelete).then(() => {
                      return res.status(500).json({
                        status: 500,
                        message: errorMessage,
                        errorRef: docRef ? docRef.id : null,
                      });
                    });
                  });
                });
            })
            .catch((error) => {
              let errorMessage = "There was a problem detecting speech.";
              saveError({
                message: errorMessage,
                timestamp: admin.database.ServerValue.TIMESTAMP,
                error: JSON.stringify(error, Object.getOwnPropertyNames(error)),
                videoFilename,
                audioFilename,
                words,
              }).then((docRef) => {
                deleteFiles(filesToDelete).then(() => {
                  return res.status(500).json({
                    status: 500,
                    message: errorMessage,
                    errorRef: docRef ? docRef.id : null,
                  });
                });
              });
            });
        })
        .catch((error) => {
          let errorMessage = "There was a problem extracting the audio.";
          saveError({
            message: errorMessage,
            timestamp: admin.database.ServerValue.TIMESTAMP,
            error: JSON.stringify(error, Object.getOwnPropertyNames(error)),
            videoFilename,
            audioFilename,
            words,
          }).then((docRef) => {
            deleteFiles(filesToDelete).then(() => {
              return res.status(500).json({
                status: 500,
                message: errorMessage,
                errorRef: docRef ? docRef.id : null,
              });
            });
          });
        });
    });
});

app.get("*", (req, res) => {
  return res.sendFile(path.resolve("../client/build/index.html"));
});

let uid = () => {
  return Math.floor(Math.random() * 90000) + 10000;
};

let deleteFiles = (files) => {
  return new Promise((res) => {
    let deletePromises = files.map((file) =>
      fs.unlink(file, (err) => {
        if (err) {
          console.warn(`Couldn't delete ${file}`);
        }
      })
    );
    Promise.all(deletePromises)
      .then(() => res())
      .catch(() => res());
  });
};

let saveError = (params) => {
  return new Promise((res) => {
    errorCollection
      .add(params)
      .then((docRef) => res(docRef))
      .catch(() => {
        res(null);
      });
  });
};

const sendProgress = (socket, progress, status, message) => {
  io.to(socket).emit("progress", { progress, status, message });
};
