import {
  Flex,
  Stack,
  useColorMode,
  Heading,
  Button,
  Input,
  Text,
  IconButton,
  Icon,
  useToast,
  CircularProgress,
  CircularProgressLabel,
  Link,
} from "@chakra-ui/react";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiPlus,
  FiUploadCloud,
  FiX,
} from "react-icons/all";
import io from "socket.io-client";

const Upload = () => {
  const toast = useToast();
  const { colorMode } = useColorMode();
  const [stepIndex, setStepIndex] = useState(0);
  const [videoFile, setVideoFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [words, setWords] = useState([]);
  const [wordToAdd, setWordToAdd] = useState("");
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("Starting...");
  const [status, setStatus] = useState("loading");
  const [downloadUrl, setDownloadUrl] = useState(null);
  const socketId = useRef();

  useEffect(() => {
    const socket = io("/");

    socket.on("connect", () => {
      socketId.current = socket.id;
    });

    socket.on("progress", (data) => {
      setProgress(data.progress);
      setProgressMessage(data.message);

      if (data.progress >= 1) {
        setProgress(1);
      }
    });
  }, []);

  const handleError = (e) => {
    let errorMessage;

    switch (e[0].errors[0].code) {
      case "file-invalid-type":
        errorMessage = "It looks like you've uploaded the wrong file type.";
        break;
      case "file-too-large":
        errorMessage = "It looks like your file is too big.";
        break;
      default:
        errorMessage = "Something went wrong!";
        break;
    }

    toast({
      status: "error",
      position: "bottom-right",
      title: "Uh oh!",
      description: errorMessage,
    });
  };

  const onVideoDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setVideoFile(acceptedFiles[0]);
    }
  }, []);
  const {
    getRootProps: getVideoRootProps,
    getInputProps: getVideoInputProps,
    isDragActive: isVideoDragActive,
  } = useDropzone({
    onDrop: onVideoDrop,
    accept: "video/mp4,video/x-m4v,video/*",
    maxSize: 33554432,
    onDropRejected: handleError,
  });

  const onAudioDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setAudioFile(acceptedFiles[0]);
    }
  }, []);
  const {
    getRootProps: getAudioRootProps,
    getInputProps: getAudioInputProps,
    isDragActive: isAudioDragActive,
  } = useDropzone({
    onDrop: onAudioDrop,
    accept: "audio/*",
    maxSize: 33554432,
    onDropRejected: handleError,
  });

  const handleAddWord = () => {
    if (!words.includes(wordToAdd) && wordToAdd.trim() !== "") {
      setWords((curr) => [wordToAdd, ...curr]);
    }
    setWordToAdd("");
  };

  const handleRemoveWord = (word) => {
    setWords((curr) => curr.filter((w) => w !== word));
  };

  const handleWordKeyDown = (e) => {
    if (e.keyCode === 13) {
      handleAddWord();
    }
  };

  const handleSubmit = () => {
    setStepIndex(3);

    let formData = new FormData();
    formData.append(
      "video",
      new Blob([videoFile], { type: videoFile.type }),
      videoFile.name
    );
    if (audioFile) {
      formData.append(
        "sfx",
        new Blob([audioFile], { type: audioFile.type }),
        audioFile.name
      );
    }
    formData.append("words", JSON.stringify(words));
    formData.append("socketId", socketId.current);

    fetch("/bleep", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.statusCode === 200) {
          setProgress(1);
          setStatus("completed");
          setDownloadUrl(res.url);
          setProgressMessage(res.message);
        } else {
          setProgress(1);
          setStatus("errored");
          setDownloadUrl(null);
          setProgressMessage(
            `${res.message} Please contact support with the error code ${res.errorRef}`
          );
        }
      })
      .catch((e) => {
        console.error(e);
        setStatus("errored");
        setProgressMessage(
          "Something went wrong while uploading your files. Please try again."
        );
        setProgress(1);
      });
  };

  const handleRestart = () => {
    setStepIndex(0);
    setProgressMessage("Starting...");
    setProgress(0);
    setDownloadUrl(null);
    setStatus("loading");
    setWordToAdd("");
    setWords([]);
    setVideoFile(null);
    setAudioFile(null);
  };

  return (
    <>
      <Flex
        height={"100vh"}
        width={"100vw"}
        alignItems={"center"}
        justifyContent={"center"}
        direction={"column"}
        paddingY={{ base: "100px", sm: "150px", md: "200px" }}
        overflowY={"hidden"}
      >
        <Stack
          as={Flex}
          spacing={"30px"}
          backgroundColor={
            colorMode === "light" ? "#EDF2F7" : "rgba(255, 255, 255, 0.08)"
          }
          borderRadius={"lg"}
          flex={1}
          width={{ base: "90%", sm: "75%", md: "50%" }}
          padding={"30px"}
          alignItems={"center"}
          direction={"column"}
          overflowY={"hidden"}
        >
          {stepIndex === 0 ? (
            <>
              <Heading textAlign={"center"}>Upload your video</Heading>
              <Flex
                flex={1}
                {...getVideoRootProps()}
                width={"100%"}
                borderStyle={"dashed"}
                borderWidth={"5px"}
                borderRadius={"lg"}
                _hover={{
                  backgroundColor: "rgba(0, 0, 0, 0.1)",
                }}
                alignItems={"center"}
                justifyContent={"center"}
                cursor={"pointer"}
                direction={"column"}
                padding={"15px"}
                position={"relative"}
              >
                <Input {...getVideoInputProps()} />
                <Text fontWeight={700} fontSize={"xl"} textAlign={"center"}>
                  Drop and drop or click to upload your video
                </Text>
                {isVideoDragActive ? (
                  <Flex
                    position={"absolute"}
                    zIndex={1}
                    backgroundColor={"rgba(0, 0, 0, 0.3)"}
                    borderRadius={"lg"}
                    top={0}
                    bottom={0}
                    left={0}
                    right={0}
                    alignItems={"center"}
                    justifyContent={"center"}
                  >
                    <Icon
                      as={FiUploadCloud}
                      color={"brand.400"}
                      boxSize={"20%"}
                    />
                  </Flex>
                ) : null}
              </Flex>
              {videoFile ? (
                <Flex
                  justifyContent={"space-between"}
                  width={"100%"}
                  alignItems={"center"}
                  backgroundColor={
                    colorMode === "light" ? "gray.200" : "gray.900"
                  }
                  borderRadius={"lg"}
                  padding={"10px"}
                >
                  <Text isTruncated marginRight={"15px"}>
                    {videoFile.name}
                  </Text>
                  <IconButton
                    onClick={() => setVideoFile(null)}
                    aria-label={"Remove video file"}
                    icon={<FiX />}
                    size={"sm"}
                  />
                </Flex>
              ) : null}
              <Button
                isDisabled={videoFile === null}
                alignSelf={"flex-end"}
                colorScheme={"brand"}
                rightIcon={<FiArrowRight />}
                onClick={() => setStepIndex(1)}
              >
                Next
              </Button>
            </>
          ) : stepIndex === 1 ? (
            <>
              <Heading textAlign={"center"}>
                Change the default sound effect
              </Heading>
              <Flex
                flex={1}
                {...getAudioRootProps()}
                width={"100%"}
                borderStyle={"dashed"}
                borderWidth={"5px"}
                borderRadius={"lg"}
                _hover={{
                  backgroundColor: "rgba(0, 0, 0, 0.1)",
                }}
                alignItems={"center"}
                justifyContent={"center"}
                cursor={"pointer"}
                direction={"column"}
                padding={"15px"}
                position={"relative"}
              >
                <Input {...getAudioInputProps()} />
                <Text fontWeight={700} fontSize={"xl"} textAlign={"center"}>
                  Drop and drop or click to upload an audio file
                </Text>
                {isAudioDragActive ? (
                  <Flex
                    position={"absolute"}
                    zIndex={1}
                    backgroundColor={"rgba(0, 0, 0, 0.3)"}
                    borderRadius={"lg"}
                    top={0}
                    bottom={0}
                    left={0}
                    right={0}
                    alignItems={"center"}
                    justifyContent={"center"}
                  >
                    <Icon
                      as={FiUploadCloud}
                      color={"brand.400"}
                      boxSize={"20%"}
                    />
                  </Flex>
                ) : null}
              </Flex>
              {audioFile ? (
                <Flex
                  justifyContent={"space-between"}
                  width={"100%"}
                  alignItems={"center"}
                  backgroundColor={
                    colorMode === "light" ? "gray.200" : "gray.900"
                  }
                  borderRadius={"lg"}
                  padding={"10px"}
                >
                  <Text isTruncated marignRight={"15px"}>
                    {audioFile.name}
                  </Text>
                  <IconButton
                    onClick={() => setAudioFile(null)}
                    aria-label={"Remove audio file"}
                    icon={<FiX />}
                    size={"sm"}
                  />
                </Flex>
              ) : null}
              <Flex
                alignItems={"center"}
                justifyContent={"space-between"}
                width={"100%"}
              >
                <Button
                  leftIcon={<FiArrowLeft />}
                  onClick={() => setStepIndex(0)}
                >
                  Previous
                </Button>
                <Button
                  colorScheme={"brand"}
                  rightIcon={audioFile === null ? null : <FiArrowRight />}
                  onClick={() => setStepIndex(2)}
                >
                  {audioFile === null ? "Skip & Use Default" : "Next"}
                </Button>
              </Flex>
            </>
          ) : stepIndex === 2 ? (
            <>
              <Heading textAlign={"center"}>Blacklist words</Heading>
              <Stack
                as={Flex}
                direction={"row"}
                alignItems={"center"}
                width={"100%"}
              >
                <Input
                  value={wordToAdd}
                  onChange={(e) => setWordToAdd(e.target.value)}
                  placeholder={"Add a word..."}
                  flex={1}
                  onKeyDown={handleWordKeyDown}
                />
                <Button
                  colorScheme={"brand"}
                  rightIcon={<FiPlus />}
                  onClick={handleAddWord}
                >
                  Add
                </Button>
              </Stack>
              <Flex
                flex={1}
                width={"100%"}
                direction={"column"}
                overflowY={"auto"}
              >
                {words.map((word) => (
                  <Flex
                    alignItems={"center"}
                    justifyContent={"space-between"}
                    padding={"10px"}
                  >
                    <Text>{word}</Text>
                    <IconButton
                      aria-label={`Remove ${word} from blacklist`}
                      icon={<FiX />}
                      size={"sm"}
                      variant={"ghost"}
                      onClick={() => handleRemoveWord(word)}
                    />
                  </Flex>
                ))}
              </Flex>
              <Flex
                alignItems={"center"}
                justifyContent={"space-between"}
                width={"100%"}
              >
                <Button
                  leftIcon={<FiArrowLeft />}
                  onClick={() => setStepIndex(0)}
                >
                  Previous
                </Button>
                <Button
                  isDisabled={words.length <= 0}
                  colorScheme={"brand"}
                  onClick={handleSubmit}
                >
                  Censor your S%*t
                </Button>
              </Flex>
            </>
          ) : (
            <Stack
              as={Flex}
              direction={"column"}
              alignItems={"center"}
              justifyContent={"center"}
              flex={1}
              width={"100%"}
            >
              <CircularProgress
                value={progress * 100}
                size={"250px"}
                color={status === "errored" ? "red.500" : "brand.400"}
                capIsRound
              >
                <CircularProgressLabel fontWeight={700}>
                  {status === "errored" ? (
                    <Icon as={FiX} color={"red.500"} />
                  ) : status === "completed" ? (
                    <Icon as={FiCheck} color={"brand.400"} />
                  ) : (
                    `${progress * 100}%`
                  )}
                </CircularProgressLabel>
              </CircularProgress>
              <Text
                fontWeight={600}
                fontSize={"30px"}
                color={status === "errored" ? "red.500" : "brand.400"}
                textAlign={"center"}
              >
                {progressMessage}
              </Text>
              {status === "errored" ? (
                <Button onClick={handleRestart} colorScheme={"red"}>
                  Restart
                </Button>
              ) : null}
              {downloadUrl ? (
                <Button
                  as={Link}
                  textDecoration={"none !important"}
                  colorScheme={"brand"}
                  href={downloadUrl}
                  isExternal
                >
                  Get your s%*t
                </Button>
              ) : null}
            </Stack>
          )}
        </Stack>
      </Flex>
    </>
  );
};

export default Upload;
