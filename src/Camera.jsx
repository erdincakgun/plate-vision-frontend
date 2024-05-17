import { useState, useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { ImageList, ImageListItem, ImageListItemBar, Box, Button, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import axios from 'axios';

const Camera = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [results, setResults] = useState(null);
  const webcamRef = useRef(null);

  useEffect(() => {
    const getDevices = async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    };
    getDevices();
  }, []);

  const handleDeviceChange = (event) => {
    setSelectedDeviceId(event.target.value);
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setUploadedImage(imageSrc);
    sendImage(imageSrc);
  }, [webcamRef]);

  const handleUploadChange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target.result);
      sendImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const sendImage = async (imageSrc) => {
    try {
      const blob = await fetch(imageSrc).then(res => res.blob());
      const formData = new FormData();
      formData.append('file', blob);

      const response = await axios.post('https://plate-vision-api.erdincakgun.com/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setResults(response.data);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  return (
    <Box display="flex" justifyContent="space-between">
      <Box display="flex" flexDirection="column" p={2}>
        <FormControl variant="outlined" sx={{ minWidth: 240, mb: 2 }}>
          <InputLabel id="camera-select-label">Select Camera</InputLabel>
          <Select
            labelId="camera-select-label"
            value={selectedDeviceId}
            onChange={handleDeviceChange}
            label="Select Camera"
          >
            {devices.map(device => (
              <MenuItem key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${device.deviceId}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box mb={2}>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ deviceId: selectedDeviceId }}
            width={320}
            height={240}
            style={{ borderRadius: 8, border: '1px solid #ccc', display: uploadedImage ? 'none' : 'block' }}
          />
          {uploadedImage && (
            <img src={uploadedImage} alt="Uploaded" style={{ width: 320, height: 240, borderRadius: 8, border: '1px solid #ccc' }} />
          )}
        </Box>
        <Button variant="contained" color="primary" onClick={capture} sx={{ mb: 1 }}>
          Capture Photo
        </Button>
        <Typography variant="body1" textAlign="center" gutterBottom>or</Typography>
        <Button variant="contained" component="label" color="secondary">
          Upload Photo
          <input type="file" accept="image/*" hidden onChange={handleUploadChange} />
        </Button>

        {results && (
          <Box mt={4}>
            <Typography variant="h6">Results:</Typography>
            <Typography>Plate Numbers: {results.plate_numbers.join(', ')}</Typography>
          </Box>
        )}
      </Box>
      {results && results.encoded_plates && results.encoded_plates.length > 0 && (
        <ImageList variant="masonry" cols={3} gap={8}>
          {results.encoded_plates.map((encodedPlate, index) => (
            <ImageListItem key={index}>
              <img
                src={`data:image/jpeg;base64,${encodedPlate}`}
                alt={`Plate ${index + 1}`}
                loading="lazy"
              />
              <ImageListItemBar position="below" title={results.plate_numbers[index]} />
            </ImageListItem>
          ))}
        </ImageList>
      )}
    </Box>
  );
};

export default Camera;
