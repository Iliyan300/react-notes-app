import React from "react"
import Sidebar from "./components/Sidebar"
import Editor from "./components/Editor"
import Split from "react-split"
import { notesCollection, db } from "./firebaseConfig"
import { 
    onSnapshot, 
    setDoc,
    addDoc,
    doc,
    deleteDoc } from "firebase/firestore"

export default function App() {
    
    // DATA FROM SERVER GOES HERE //
    const [notes, setNotes] = React.useState([])
    const [currentNoteId, setCurrentNoteId] = React.useState("")
    const [tempNoteText, setTempNoteText] = React.useState("")
    
    /* ---- Returns the current note we select, if false returns the first note ---- */
        const currentNote = notes.find(note => note.id === currentNoteId) || notes[0]

        /* ---- Orders the items in the array from most-recently-updated to least-recently-updated.---- */
        const sortNotes= notes.sort((a,b) => b.updatedAt - a.updatedAt)
            
        
        // RECIEVING FROM SERVER, SENDING TO STATE //
    React.useEffect(() => {
        
        const unsubscribe = onSnapshot(notesCollection, function (snapshot) {
        const notesArr = snapshot.docs.map(doc => ({
            ...doc.data(), 
            id: doc.id // firebase unique id //
        }))
        setNotes(notesArr);
        })
        // clean the listener 
        return unsubscribe; 
    }, [])

    // --- if there is nothing in currentNoteId set an Id --- //
    React.useEffect(() => {
       
        if (!currentNoteId) {
            setCurrentNoteId(notes[0]?.id)
        }
    }, [notes])

    // --- if we change something in our currentNote, we set the tempNote to currentNote's text --- //
    React.useEffect(() => {
        
        if(currentNote) {
            setTempNoteText(currentNote.body)
        }
        
    },[currentNote])


    // --- Debouncing logic --- //
    React.useEffect(() => {

        const debounce = setTimeout(() => {
            if(tempNoteText !== currentNote.body) { 
                
                updateNote(tempNoteText) 
            }
        }, 500)

        return () => clearTimeout(debounce)

    }, [tempNoteText])


    /* ---- Adds new note obj to the notes array ---- */
    async function createNewNote() {
        const newNote = {
            body: "# Type your markdown note's title here",
            createdAt: Date.now(),
            updatedAt: Date.now()
        }
        // ADDS NEW NOTE TO SERVER //
        const noteReff = await addDoc(notesCollection, newNote)
        setCurrentNoteId(noteReff.id) // sets the new note unique id //
    }


    /*---- Updates the current note body text and updatedAt value to the new time ---- */
    
    async function updateNote(text) {
        const docRef = doc(db, "notes", currentNoteId);
        // UPDATES NOTE IN SERVER //
       await setDoc(
        docRef, 
        {body: text, updatedAt: Date.now()}, 
        {merge:true}
        )
    }

    // ---- Deletes the current note ---- //
    async function deleteNote(noteId) {
       const docRef = doc(db, "notes", noteId);
       // DELETING NOTE IN SERVER //
       await deleteDoc(docRef);
    }

    return (
        <main>
            {
                notes.length > 0
                    ?
                    <Split
                        sizes={[30, 70]}
                        direction="horizontal"
                        className="split"
                    >
                        <Sidebar
                            notes={sortNotes}
                            currentNote={currentNote}
                            setCurrentNoteId={setCurrentNoteId}
                            newNote={createNewNote}
                            deleteNote={deleteNote}
                        
                        />
                        {
                           <Editor
                                tempNote={tempNoteText}
                                setTempNote={setTempNoteText}
                            />
                        }
                    </Split>
                    :
                    <div className="no-notes">
                        <h1>You have no notes</h1>
                        <button
                            className="first-note"
                            onClick={createNewNote}
                        >
                            Create one now
                </button>
                    </div>

            }
        </main>
    )
}
