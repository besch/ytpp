import React, { useEffect } from "react";

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
        <button onClick={() => addElement("rectangle")}>Add Rectangle</button>
        <button onClick={() => addElement("circle")}>Add Circle</button>
        <button onClick={() => addElement("text")}>Add Text</button>
      </div>
      <button onClick={saveElements}>Save Elements</button>
    </div>
  );
};

export default EditPage;
