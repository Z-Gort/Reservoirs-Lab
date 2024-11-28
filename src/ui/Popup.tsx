import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import TextFieldWithLabel from "./components/TextFieldWithLabel";
import SubmitButton from "./components/SubmitButton";
import FormContainer from "./components/FormContainer";
import Header from "./components/Header";
import CloseButton from "./components/CloseButton";

function Popup() {
  
  // State for error messages
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    console.log("Setting up listener for databaseConnectionStatus");
  
    const unsubscribe = window.electron.on("databaseConnectionStatus", ({ success }: { success: boolean }) => {
      if (success) {
        window.close();
      } else {
        setErrorMessage("Failed to connect to the database. Please try again.");
      }
    });
  
    return unsubscribe; // Cleanup when the component unmounts
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    // Ensure the event target is typed correctly
    const form = e.target as HTMLFormElement;
  
    const formData = new FormData(form);
    const connectionData = {
      host: formData.get("host") as string,
      port: formData.get("port") as string,
      user: formData.get("user") as string,
      password: formData.get("password") as string,
      database: formData.get("database") as string,
    };
  
    try {
      window.electron.send("connectToDatabase", connectionData);
      console.log("Connection data sent successfully:", connectionData);
    } catch (error) {
      console.error("Failed to connect to the database:", error);
    }
  };
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: "2rem",
        boxSizing: "border-box",
      }}
    >
      <CloseButton onClick={() => window.close()} /> 
      <Header text="Add Connection" variant="h4" />
      <Box
        sx={{
          marginBottom: "1rem",
        }}
      />
      <FormContainer onSubmit={handleSubmit}>
        <TextFieldWithLabel label="Host" name="host" required />
        <TextFieldWithLabel label="Port" name="port" type="number" required />
        <TextFieldWithLabel label="User" name="user" required />
        <TextFieldWithLabel
          label="Password"
          name="password"
          type="password"
          required
        />
        <TextFieldWithLabel label="Database" name="database" required />
        <SubmitButton label="Connect" />
      </FormContainer>

      {/* Display error message */}
      {errorMessage && (
        <Box sx={{ color: "red", marginTop: "1rem" }}>{errorMessage}</Box>
      )}
    </Box>
  );
}

export default Popup;