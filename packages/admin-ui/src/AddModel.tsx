import React, { useState } from 'react';
import { TextField, Button, Container, Typography } from '@mui/material';
import { createLangFlowMapping } from './services/endpoints';

const AddModel = () => {
  const [model, setModel] = useState('');
  const [url, setUrl] = useState('');
  const [historyComponentID, setHistoryComponentID] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const data = {
      model,
      url,
      historyComponentID,
    };

    try {
      const response = await createLangFlowMapping(data);
      console.log(response);
    } catch (error) {
      console.error('Error creating LangFlow model:', error); 
    }

  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Add Custom Model From Langflow
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Model"
          value={model}
          onChange={(e : React.ChangeEvent<HTMLInputElement>) => setModel(e.target.value)}
          fullWidth
          required
          margin="normal"
          placeholder="Enter model name"
        />
        <TextField
          label="URL"
          value={url}
          onChange={(e : React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
          fullWidth
          required
          margin="normal"
        />
        <TextField
          label="History Component ID"
          value={historyComponentID}
          onChange={(e : React.ChangeEvent<HTMLInputElement>) => setHistoryComponentID(e.target.value)}
          fullWidth
          required
          margin="normal"
        />
        <Button type="submit" variant="contained" color="primary">
          Submit
        </Button>
      </form>
    </Container>
  );
};

export default AddModel;