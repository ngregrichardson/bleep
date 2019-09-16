require("dotenv").config();
const express = require("express");
const favicon = require("express-favicon");
const fileUpload = require("express-fileupload");
const path = require("path");
const Mp4Convert = require("mp4-convert");
const extractAudio = require("ffmpeg-extract-audio");
const speech = require("@google-cloud/speech");
const audioconcat = require("audioconcat");
const MP3Cutter = require("mp3-cutter");
const ffmpeg = require("fluent-ffmpeg");
const tracer = require("tracer").console();
const fs = require("fs");
const schedule = require("node-schedule");
const app = express();
const Pusher = require("pusher");

let current = [];
let finished = false;
let toBeDeleted = [];

app.use(favicon(__dirname + "/client/build/favicon.ico"));
app.use(express.static(__dirname));
app.use("/download", express.static(path.join(__dirname, "client/output")));
app.use(express.static(path.join(__dirname, "client/build")));
app.use(express.json());
app.use(fileUpload());
app.use(express.urlencoded({ extended: true }));
var channels_client = new Pusher({
  appId: process.env.APP_ID,
  key: process.env.KEY,
  secret: process.env.SECRET,
  cluster: "us2",
  encrypted: true
});
var job = schedule.scheduleJob("42 * * * *", function() {
  toBeDeleted.forEach(video => {
    if(video.time > new Date().getTime()) {
      fs.unlink(video.name, err => {
        if(err) {
          return tracer.log(err);
        }
        toBeDeleted.splice(toBeDeleted.indexOf(video), 1);
      });
    }
  })
});

app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

app.get("/download/*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/output", `${req.url.split("/")[req.url.split("/").length - 1]}_output.mp4`));
});

app.post("/upload", async (req, res) => {
  let name = generateName();
  let fileName = `${name}.${req.files.video.mimetype.split("/")[1]}`;
  let swears = JSON.parse(req.body.swears);
  req.files.video.name = fileName;
  let customSfx = req.files.sfx !== undefined ? true : false;
  if (customSfx) {
    req.files.sfx.name = `${name}.mp3`;
  }
  let duration;
  req.files.video.mv(`${__dirname}\\client\\converting\\${fileName}`, err => {
    if (err) {
      tracer.log(err);
      return res.send({
        error: err,
        errorMessage: `there was a problem saving the file. the file may be corrupt or an unsupported file type. please notify support with the case number ${name} and the time code ${new Date().getTime()}`
      });
    }
    let convert = new Mp4Convert(
      `${__dirname}/client/converting/${fileName}`,
      `${__dirname}/client/converted/${name}.mp4`
    );
    progress("update", {
      message: "converting video...",
      progress: "15%",
      finished: false
    });
    convert.on("ffprobeOutput", json => {
      duration = parseFloat(json.streams[0].duration).toFixed(2);
    });
    convert.on("ffprobeOutput", json => {
      duration = parseFloat(json.streams[0].duration).toFixed(2);
    });
    convert.on("done", async () => {
      progress("update", {
        message: "extracting audio...",
        progress: "30%",
        finished: false
      });
      extractAudio({
        input: `${__dirname}\\client\\converted\\${fileName}`,
        output: `${__dirname}\\client\\audio\\${name}.mp3`
      }).then(async () => {
        progress("update", {
          message: "detecting speech...",
          progress: "45%",
          finished: false
        });
        let client = new speech.SpeechClient();
        let file = fs.readFileSync(`${__dirname}\\client\\audio\\${name}.mp3`);
        let bytes = file.toString("base64");
        let audio = {
          content: bytes
        };
        let config = {
          encoding: "MP3",
          languageCode: "en-US",
          enableWordTimeOffsets: true,
          sampleRateHertz: 16000
        };
        let request = {
          audio: audio,
          config: config
        };
        let transcript = [];
        client
          .recognize(request)
          .then(([response]) => {
            if (response.results.length === 0) {
              progress("update", {
                message: "no words found...",
                progress: "100%",
                finished: true
              });
              return;
            }
            progress("update", {
              message: "detecting swears...",
              progress: "60%",
              finished: false
            });
            response.results.forEach(result => {
              result.alternatives[0].words.forEach(wordInfo => {
                let start = parseFloat(
                  `${wordInfo.startTime.seconds}.${wordInfo.startTime.nanos /
                    100000000}`
                );
                let end = parseFloat(
                  `${wordInfo.endTime.seconds}.${wordInfo.endTime.nanos /
                    100000000}`
                );
                let runTime = (end - start).toFixed(2);
                let swear = false;
                for (var word in swears) {
                  if (
                    swears[word].toLowerCase() === wordInfo.word.toLowerCase()
                  ) {
                    swear = true;
                    break;
                  }
                }
                transcript.push({
                  word: wordInfo.word,
                  start,
                  end,
                  runTime,
                  swear
                });
              });
            });
            progress("update", {
              message: "removing swears...",
              progress: "75%",
              finished: false
            });
            let clips = [];
            var rev = transcript.slice().reverse();
            let last = transcript.indexOf(
              rev.find(e => {
                return e.swear === true;
              })
            );
            let lastSwear;
            if (customSfx) {
              req.files.video.mv(
                `${__dirname}\\client\\sfx\\${name}.mp3`,
                err => {
                  if (err) {
                    tracer.log(err);
                    return res.send({
                      error: err,
                      errorMessage: `there was a problem saving the file. the file may be corrupt or an unsupported file type. please notify support with the case number ${name} and the time code ${new Date().getTime()}`
                    });
                  }
                  for (var word in transcript) {
                    if (transcript[word].swear === true) {
                      MP3Cutter.cut({
                        src: `${__dirname}\\client\\audio\\${name}.mp3`,
                        target: `${__dirname}\\client\\trimmed\\${name}_${word}.mp3`,
                        start: clips.length === 0 ? 0 : lastSwear.end,
                        end: transcript[word].start
                      });
                      clips.push(
                        `${__dirname}\\client\\trimmed\\${name}_${word}.mp3`
                      );
                      MP3Cutter.cut({
                        src: `${__dirname}\\client\\sfx\\${req.files.sfx.name}`,
                        target: `${__dirname}\\client\\trimmed\\${name}_bleep_${word}.mp3`,
                        start: 0,
                        end: transcript[word].runTime
                      });
                      clips.push(
                        `${__dirname}\\client\\trimmed\\${name}_bleep_${word}.mp3`
                      );
                      lastSwear = transcript[word];
                    } else {
                      if (parseInt(word) === last + 1) {
                        MP3Cutter.cut({
                          src: `${__dirname}\\client\\audio\\${name}.mp3`,
                          target: `${__dirname}\\client\\trimmed\\${name}_${word}.mp3`,
                          start: transcript[word].start,
                          end: duration
                        });
                        clips.push(
                          `${__dirname}\\client\\trimmed\\${name}_${word}.mp3`
                        );
                        break;
                      }
                    }
                  }
                  progress("update", {
                    message: "merging audio...",
                    progress: "90%",
                    finished: false
                  });
                  audioconcat(clips)
                    .concat(`${__dirname}\\client\\finalAudio\\${name}.mp3`)
                    .on("error", (err, stdout, stderr) => {
                      tracer.log(err);
                      return res.send({
                      error: err,
                      errorMessage: `there was a problem merging the audio. please notify support with the case number ${name} and the time code ${new Date().getTime()}`});
                    })
                    .on("end", output => {
                      progress("update", {
                        message: "repairing video...",
                        progress: "95%",
                        finished: false
                      });
                      ffmpeg()
                        .addInput(
                          `${__dirname}\\client\\converted\\${fileName}`
                        )
                        .noAudio()
                        .on("end", () => {
                          ffmpeg()
                            .addInput(
                              `${__dirname}\\client\\output\\${name}_silent.mp4`
                            )
                            .addInput(
                              `${__dirname}\\client\\finalAudio\\${name}.mp3`
                            )
                            .on("end", () => {
                              progress("update", {
                                message: "cleaning up...",
                                progress: "99%",
                                finished: false
                              });
                              let filesToDelete = [
                                `${__dirname}\\client\\converting\\${fileName}`,
                                `${__dirname}\\client\\converted\\${fileName}`,
                                `${__dirname}\\client\\audio\\${name}.mp3`,
                                `${__dirname}\\client\\finalAudio\\${name}.mp3`,
                                `${__dirname}\\client\\output\\${name}_silent.mp4`,
                                `${__dirname}\\client\\sfx\\${name}.mp3`
                              ];
                              filesToDelete = filesToDelete.concat(clips);
                              deleteFiles(filesToDelete)
                                .then(err => {
                                  if (err) {
                                    tracer.log(err);
                                    return res.send({
                                      error: err,
                                      errorMessage: `there was a problem deleting remaining files. please notify support with the case number ${name} and the time code ${new Date().getTime()}`
                                    });
                                  }
                                  current.splice(current.indexOf(name), 1);
                                  progress("update", {
                                    message: "finished...",
                                    progress: "100%",
                                    finished: true,
                                    id: name
                                  });
                                  finished = true;
                                  toBeDeleted.push({ name: `${name}_output.mp4`, time: (Math.round(new Date().getTime() / 1000)) + (24 * 3600)});
                                  return res.send({ status: "DONE" });
                                })
                                .catch(err => {
                                  tracer.log(err);
                                  return res.send({
                                    error: err,
                                    errorMessage: `there was a problem deleting remaining files. please notify support with the case number ${name} and the time code ${new Date().getTime()}`
                                  });
                                });
                            })
                            .save(
                              `${__dirname}\\client\\output\\${name}_output.mp4`
                            );
                        })
                        .save(
                          `${__dirname}\\client\\output\\${name}_silent.mp4`
                        );
                    });
                }
              );
            } else {
              for (var word in transcript) {
                if (transcript[word].swear === true) {
                  MP3Cutter.cut({
                    src: `${__dirname}\\client\\audio\\${name}.mp3`,
                    target: `${__dirname}\\client\\trimmed\\${name}_${word}.mp3`,
                    start: clips.length === 0 ? 0 : lastSwear.end,
                    end: transcript[word].start
                  });
                  clips.push(
                    `${__dirname}\\client\\trimmed\\${name}_${word}.mp3`
                  );
                  MP3Cutter.cut({
                    src: `${__dirname}\\client\\sfx\\beep.mp3`,
                    target: `${__dirname}\\client\\trimmed\\${name}_bleep_${word}.mp3`,
                    start: 0,
                    end: transcript[word].runTime
                  });
                  clips.push(
                    `${__dirname}\\client\\trimmed\\${name}_bleep_${word}.mp3`
                  );
                  lastSwear = transcript[word];
                } else {
                  if (parseInt(word) === last + 1) {
                    MP3Cutter.cut({
                      src: `${__dirname}\\client\\audio\\${name}.mp3`,
                      target: `${__dirname}\\client\\trimmed\\${name}_${word}.mp3`,
                      start: transcript[word].start,
                      end: duration
                    });
                    clips.push(
                      `${__dirname}\\client\\trimmed\\${name}_${word}.mp3`
                    );
                    break;
                  }
                }
              }
              progress("update", {
                message: "merging audio...",
                progress: "90%",
                finished: false
              });
              audioconcat(clips)
                .concat(`${__dirname}\\client\\finalAudio\\${name}.mp3`)
                .on("error", (err, stdout, stderr) => {
                  tracer.log(err);
                  return res.send({
                    error: err,
                    errorMessage: `there was a problem merging the audio. please notify support with the case number ${name} and the time code ${new Date().getTime()}`
                  });
                })
                .on("end", output => {
                  progress("update", {
                    message: "repairing video...",
                    progress: "95%",
                    finished: false
                  });
                  ffmpeg()
                    .addInput(`${__dirname}\\client\\converted\\${fileName}`)
                    .noAudio()
                    .on("end", () => {
                      ffmpeg()
                        .addInput(
                          `${__dirname}\\client\\output\\${name}_silent.mp4`
                        )
                        .addInput(
                          `${__dirname}\\client\\finalAudio\\${name}.mp3`
                        )
                        .on("end", () => {
                          progress("update", {
                            message: "cleaning up...",
                            progress: "99%",
                            finished: false
                          });
                          let filesToDelete = [
                            `${__dirname}\\client\\converting\\${fileName}`,
                            `${__dirname}\\client\\converted\\${fileName}`,
                            `${__dirname}\\client\\audio\\${name}.mp3`,
                            `${__dirname}\\client\\finalAudio\\${name}.mp3`,
                            `${__dirname}\\client\\output\\${name}_silent.mp4`
                          ];
                          filesToDelete = filesToDelete.concat(clips);
                          deleteFiles(filesToDelete)
                            .then(err => {
                              if (err) {
                                tracer.log(err);
                                return res.send({
                                  error: err,
                                  errorMessage: `there was a problem deleting remaining files. please notify support with the case number ${name} and the time code ${new Date().getTime()}`
                                });
                              }
                              current.splice(current.indexOf(name), 1);
                              progress("update", {
                                message: "finished...",
                                progress: "100%",
                                finished: true,
                                id: name
                              });
                              finished = true;
                              return res.send({ status: "DONE" });
                            })
                            .catch(err => {
                              tracer.log(err);
                              return res.send({
                                error: err,
                                errorMessage: `there was a problem deleting remaining files. please notify support with the case number ${name} and the time code ${new Date().getTime()}`
                              });
                            });
                        })
                        .save(
                          `${__dirname}\\client\\output\\${name}_output.mp4`
                        );
                    })
                    .save(`${__dirname}\\client\\output\\${name}_silent.mp4`);
                });
            }
          })
          .catch(err => {
            tracer.log(err);
          });
      });
    });
    convert.start();
  });
});

app.listen(process.env.PORT || 3001, () =>
  tracer.log(`Listening on port ${process.env.PORT || 3001}`)
);

let deleteFiles = async files => {
  var i = files.length;
  return new Promise((res, rej) => {
    files.forEach(filepath => {
      fs.unlink(filepath, err => {
        if (err) {
          rej(err);
        }
        i--;
        if (i === 0) {
          res(null);
        }
      });
    });
  });
};

let progress = (event, data = {}) => {
  if(finished === true) {
    channels_client.trigger("progress", event, data);
  }
};

let generateName = () => {
  let name = `${parseInt(Math.random() * 1000000000, 10)}`;
  if (!current.includes(name)) {
    current.push(name);
    return name;
  } else {
    return generateName();
  }
};

let moveFile = async (file, dir) => {
  return new Promise((res, rej) => {
    file.mv(dir, err => {
      if (err) {
        rej(err);
      }
      res(null);
    });
  });
};
