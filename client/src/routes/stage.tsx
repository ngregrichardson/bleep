// @ts-ignore
import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Input,
  Uploader,
  List,
  IconButton,
  Icon,
  InputGroup,
  Progress,
  Alert,
  Whisper,
  Tooltip,
  Modal,
} from "rsuite";
import { AnimatePresence, motion } from "framer-motion";
// @ts-ignore
import io from "socket.io-client";
// @ts-ignore
import { useMediaQuery } from "react-responsive";

const defaultWords = [
  "fuck",
  "shit",
  "bitch",
  "bastard",
  "fucker",
  "hell",
  "damn",
  "dam",
  "dick",
  "dickhead",
  "ass",
  "asshole",
  "dumbass",
  "cunt",
  "kike",
  "pussy",
  "twat",
  "slut",
  "ho",
  "hoe",
  "douche",
  "douchebag",
];

const progressStyle = { width: 120, display: "inline-block", marginRight: 10 };

interface ProgressObject {
  progress: number;
  status: string;
  message: string;
}

function Stage() {
  const [stage, setStage] = useState(1);
  const [video, setVideo] = useState(null);
  const [sfx, setSfx] = useState(null);
  const [words, setWords] = useState(defaultWords.sort());
  const [word, setWord] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Starting...");
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [errorId, setErrorId] = useState(null);
  const [socketId, setSocketId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const isTabletOrMobileDevice = useMediaQuery({
    query: "(max-device-width: 712px)",
  });

  useEffect(() => {
    const socket = io("/");

    socket.on("connect", () => {
      setSocketId(socket.id);
    });

    socket.on("progress", (data: ProgressObject) => {
      setProgress(data.progress);
      setStatus(data.status);
      setMessage(data.message);

      if (data.progress >= 1) {
        setProgress(1);
      }
    });
  }, []);

  let handleSetVideo = (files: Array<any>) => {
    if (files.length >= 1) {
      setVideo(files[files.length - 1]);
    } else {
      setVideo(null);
    }
  };

  let handleSetSfx = (files: Array<any>) => {
    if (files.length >= 1) {
      setSfx(files[files.length - 1]);
    } else {
      setSfx(null);
    }
  };

  let handleRemoveWord = (word: string) => {
    setWords(words.filter((w) => w !== word));
  };

  let handleAddWord = () => {
    if (!words.includes(word.trim())) {
      setWords([...words, word.trim()].sort());
    } else {
      Alert.info(`${word} is already in the list.`);
    }
    setWord("");
  };

  let handleClearAll = () => {
    setConfirmModalOpen(false);
    setWords([]);
  };

  let handleUpload = () => {
    setStage(4);
    if (video === null) {
      return Alert.error("A video is required");
    }
    if (words.length <= 0) {
      return Alert.error("At least one word is required");
    }
    let formData = new FormData();
    // @ts-ignore
    formData.append("video", video.blobFile, video.name);
    if (sfx) {
      // @ts-ignore
      formData.append("sfx", sfx.blobFile, sfx.name);
    }
    formData.append("words", JSON.stringify(words));
    formData.append("socketId", socketId || "");
    fetch("/upload", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.statusCode === 200) {
          setStatus("success");
          setDownloadUrl(res.url);
          setErrorId(null);
        } else {
          setStatus("failed");
          setDownloadUrl(null);
          if (res.errorRef) {
            setErrorId(res.errorRef);
          } else {
            setErrorId(null);
          }
        }
        setMessage(res.message);
      })
      .catch((e) => {
        console.error(e);
        setStatus("failed");
        setMessage(e.message);
      });
  };

  let handleCopyErrorId = () => {
    let textArea = document.createElement("textarea");
    textArea.value = errorId || "";
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("Copy");
    textArea.remove();
    setCopied(true);
  };

  let restartProcess = () => {
    setVideo(null);
    setStage(1);
    setSfx(null);
    setWords(defaultWords.sort());
    setWord("");
    setProgress(0);
    setStatus("loading");
    setMessage("Starting...");
    setDownloadUrl(null);
    setErrorId(null);
    setCopied(false);
  };

  return (
    <AnimatePresence exitBeforeEnter>
      {stage === 1 && (
        <motion.div
          key={"stage_1"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={"stage"}
        >
          <h3 className={"stage-title"}>Upload your video file</h3>
          <Uploader
            autoUpload={false}
            // @ts-ignore
            fileList={video !== null ? [video] : []}
            onChange={handleSetVideo}
            draggable
            multiple={false}
            accept={"video/mp4,video/x-m4v,video/*"}
          >
            <div>Click or Drag files to this area to upload</div>
          </Uploader>
          <Button
            appearance={"primary"}
            size={"lg"}
            className={"next-button"}
            onClick={() => setStage(2)}
            disabled={video === null}
          >
            Next
          </Button>
        </motion.div>
      )}
      {stage === 2 && (
        <motion.div
          key={"stage_2"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={"stage"}
        >
          <IconButton
            style={{
              position: isTabletOrMobileDevice ? undefined : "absolute",
              justifySelf: isTabletOrMobileDevice ? "flex-start" : undefined,
              alignSelf: isTabletOrMobileDevice ? "flex-start" : undefined,
              left: isTabletOrMobileDevice ? undefined : 30,
              top: isTabletOrMobileDevice ? undefined : 30,
            }}
            appearance={isTabletOrMobileDevice ? "ghost" : "subtle"}
            icon={<Icon icon={"angle-left"} />}
            onClick={() => setStage(1)}
          />
          <h3 className={"stage-title"}>Add a Custom Sound Effect</h3>
          <Uploader
            autoUpload={false}
            // @ts-ignore
            fileList={sfx !== null ? [sfx] : []}
            onChange={handleSetSfx}
            draggable
            className={"uploader"}
            multiple={false}
            accept={"audio/mp3,audio/*"}
          >
            <div>Click or Drag files to this area to upload</div>
          </Uploader>
          <Button
            appearance={"primary"}
            size={"lg"}
            className={"next-button"}
            onClick={() => setStage(3)}
          >
            {sfx !== null ? "Next" : "Skip & Use Default"}
          </Button>
        </motion.div>
      )}
      {stage === 3 && (
        <motion.div
          key={"stage_3"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={"stage"}
        >
          <IconButton
            style={{
              position: isTabletOrMobileDevice ? undefined : "absolute",
              justifySelf: isTabletOrMobileDevice ? "flex-start" : undefined,
              alignSelf: isTabletOrMobileDevice ? "flex-start" : undefined,
              left: isTabletOrMobileDevice ? undefined : 30,
              top: isTabletOrMobileDevice ? undefined : 30,
            }}
            appearance={isTabletOrMobileDevice ? "ghost" : "subtle"}
            icon={<Icon icon={"angle-left"} />}
            onClick={() => setStage(2)}
          />
          <h3 className={"stage-title"}>Select Your Words</h3>
          <InputGroup>
            <Input
              placeholder={"Add words..."}
              value={word}
              onChange={setWord}
              onPressEnter={handleAddWord}
            />
            <InputGroup.Button onClick={handleAddWord}>
              <Icon icon={"plus"} />
            </InputGroup.Button>
          </InputGroup>
          <List
            size={"sm"}
            bordered
            style={{
              width: "100%",
              marginTop: 15,
              flex: isTabletOrMobileDevice ? undefined : 4,
              height: `30vh`,
            }}
          >
            {words.map((item, index) => (
              <List.Item key={index} index={index}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  {item}
                  <IconButton
                    appearance={"subtle"}
                    icon={<Icon icon={"close"} />}
                    onClick={() => handleRemoveWord(item)}
                  />
                </div>
              </List.Item>
            ))}
          </List>
          <div
            style={{
              flex: 1,
              marginTop: 15,
              marginBottom: 15,
              display: "flex",
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Button
              appearance={"ghost"}
              size={"lg"}
              onClick={() => setConfirmModalOpen(true)}
              disabled={words.length <= 0}
            >
              Clear All
            </Button>
            <Button
              appearance={"primary"}
              size={"lg"}
              onClick={handleUpload}
              disabled={words.length <= 0}
            >
              Start That S%*t!
            </Button>
          </div>
        </motion.div>
      )}
      {stage === 4 && (
        <motion.div
          key={"stage_4"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={"stage"}
        >
          {status === "loading" && (
            <Progress.Circle
              style={progressStyle}
              percent={progress * 100}
              trailColor={"#0f131a"}
              status={"active"}
            />
          )}
          {status === "success" && (
            <Progress.Circle
              style={progressStyle}
              percent={100}
              trailColor={"#0f131a"}
              status={"success"}
            />
          )}
          {status === "failed" && (
            <Progress.Circle
              style={progressStyle}
              percent={100}
              status={"fail"}
            />
          )}
          <h3 className={`progress-message-${status}`}>{message}</h3>
          {downloadUrl && (
            <>
              <Whisper
                placement={isTabletOrMobileDevice ? "top" : "right"}
                trigger={"hover"}
                speaker={
                  <Tooltip>
                    This link will be active for the next 24 hours.
                  </Tooltip>
                }
              >
                <Button
                  appearance={"primary"}
                  size={"lg"}
                  href={downloadUrl || ""}
                  target={"_blank"}
                  className="download-button"
                >
                  Download your s%*t!
                </Button>
              </Whisper>
              <Button
                appearance={"primary"}
                size={"lg"}
                onClick={restartProcess}
                target={"_blank"}
                className="download-button"
              >
                Bleep some more!
              </Button>
            </>
          )}
          {errorId && (
            <>
              <h6 className={`progress-message-${status}`}>
                Contact support with case id{" "}
                <Whisper
                  placement={"bottom"}
                  trigger={"hover"}
                  speaker={
                    <Tooltip>{copied ? "Copied!" : "Click to copy"}</Tooltip>
                  }
                  onExited={() => setCopied(false)}
                >
                  <span
                    style={{ cursor: "pointer" }}
                    onClick={handleCopyErrorId}
                  >
                    {errorId}
                  </span>
                </Whisper>
              </h6>
              <Button
                appearance={"primary"}
                size={"lg"}
                onClick={restartProcess}
                target={"_blank"}
                className="download-button"
              >
                Try Again
              </Button>
            </>
          )}
        </motion.div>
      )}
      <Modal
        size={"xs"}
        show={confirmModalOpen}
        onHide={() => setConfirmModalOpen(false)}
      >
        <Modal.Header>
          <Modal.Title>Clear All Words?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to clear your words list entirely?
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => handleClearAll()} appearance="primary">
            Clear All
          </Button>
          <Button
            onClick={() => setConfirmModalOpen(false)}
            appearance="subtle"
          >
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </AnimatePresence>
  );
}

export default Stage;
