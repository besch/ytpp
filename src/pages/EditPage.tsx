import React, { useEffect } from "react";
import Button from "@/components/ui/Button";

const EditPage: React.FC = () => {
  const addElement = (elementType: string) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id!, {
          action: "ADD_ELEMENT",
          elementType,
        });
      }
    });
  };

  const saveElements = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id!, { action: "SAVE_ELEMENTS" });
      }
    });
  };

  useEffect(() => {
    // Enable edit mode in content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id!, { action: "ENABLE_EDIT_MODE" });
      }
    });
  }, []);

  return (
    <div className="p-4">
      <h1>Edit Page</h1>
      <div className="element-toolbar">
        <Button onClick={() => addElement("rectangle")}>Add Rectangle</Button>
        <Button onClick={() => addElement("circle")}>Add Circle</Button>
        <Button onClick={() => addElement("text")}>Add Text</Button>
      </div>
      <Button onClick={saveElements}>Save Elements</Button>
    </div>
  );
};

export default EditPage;
