import React, { useState, useEffect } from "react";
import { Editor, EditorState, ContentState, convertToRaw, convertFromRaw } from "draft-js";
import "draft-js/dist/Draft.css";
import axios from "axios";

const LetterEditor = () => {
    const [editorState, setEditorState] = useState(EditorState.createEmpty());
    const [savedDrafts, setSavedDrafts] = useState([]);

    // Load drafts from backend
    useEffect(() => {
        axios.get("http://localhost:5000/api/drafts", { withCredentials: true })
            .then(res => {
                const drafts = res.data.map(draft => ({
                    _id: draft._id,
                    content: EditorState.createWithContent(convertFromRaw(JSON.parse(draft.content)))
                }));
                setSavedDrafts(drafts);
            })
            .catch(err => console.error(err));
    }, []);

    // Save draft
    const handleSaveDraft = () => {
        const contentState = editorState.getCurrentContent();
        const rawContent = JSON.stringify(convertToRaw(contentState));

        axios.post("http://localhost:5000/api/drafts", { content: rawContent }, { withCredentials: true })
            .then(res => {
                setSavedDrafts([{ _id: res.data.draft._id, content: editorState }, ...savedDrafts]);
                alert("Draft saved!");
            })
            .catch(err => console.error(err));
    };

    // Upload to Google Drive
    const handleSave = async () => {
        const contentState = editorState.getCurrentContent();
        const textContent = contentState.getPlainText(); // Convert to plain text

        if (!textContent.trim()) {
            alert("Cannot upload an empty document.");
            return;
        }

        const blob = new Blob([textContent], { type: "text/plain" });
        const formData = new FormData();
        formData.append("file", blob, "letter.txt");

        try {
            const res = await axios.post("http://localhost:5000/api/upload", formData, {withCredentials: true}, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            alert(`Letter uploaded! File ID: ${res.data.fileId}`);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Upload failed");
        }
    };

    return (
        <div>
            <div style={{ border: "1px solid #ccc", minHeight: "200px", padding: "10px" }}>
                {/* Make sure this Editor is not read-only */}
                <Editor editorState={editorState} onChange={setEditorState} />
            </div>
            <button onClick={handleSaveDraft}>Save Draft</button>
            <button onClick={handleSave} style={{ marginLeft: "10px" }}>Upload to Google Drive</button>

            <h3>Saved Drafts:</h3>
            <ul>
                {savedDrafts.map(draft => (
                    <li key={draft._id}>
                        <div style={{ border: "1px solid #ccc", padding: "5px", marginTop: "10px" }}>
                            {/* Read-Only Drafts */}
                            <Editor editorState={draft.content} readOnly={true} />
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default LetterEditor;
