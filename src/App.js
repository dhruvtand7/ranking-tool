import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { TouchBackend } from 'react-dnd-touch-backend';
import { isMobile } from 'react-device-detect';
import { Plus, GripVertical, X } from 'lucide-react';
import './App.css';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAL-q8jDkQo2336FiAu4M1_HWO6iMvxrMw",
  authDomain: "sequencer-df263.firebaseapp.com",
  projectId: "sequencer-df263",
  storageBucket: "sequencer-df263.firebasestorage.app",
  messagingSenderId: "413478119165",
  appId: "1:413478119165:web:269b1a61a6e1a288964094",
  measurementId: "G-64PEM20M49"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DraggableItem = ({ item, index, moveItem, deleteItem }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'ITEM',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'ITEM',
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveItem(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  return (
    <div ref={(node) => drag(drop(node))} className="item" style={{ opacity: isDragging ? 0.5 : 1 }}>
      <GripVertical className="item-icon" />
      <span>{item.name}</span>
      <X className="delete-icon" onClick={() => deleteItem(index)} />
    </div>
  );
};

const App = () => {
  const [lists, setLists] = useState([]);
  const [activeListId, setActiveListId] = useState(null);
  const [newListName, setNewListName] = useState('');
  const [newItem, setNewItem] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "lists"), (snapshot) => {
      const listsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLists(listsData);
      if (!activeListId && listsData.length > 0) {
        setActiveListId(listsData[0].id);
      }
    });
    return () => unsubscribe();
  }, [activeListId]);

  const activeList = lists.find(list => list.id === activeListId);

  const addList = async (e) => {
    e.preventDefault();
    if (newListName.trim()) {
      const docRef = await addDoc(collection(db, "lists"), {
        name: newListName,
        items: []
      });
      setActiveListId(docRef.id);
      setNewListName('');
      setIsCreatingList(false);
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (newItem.trim() && activeListId) {
      const listRef = doc(db, "lists", activeListId);
      const updatedItems = [...(activeList.items || []), { name: newItem.trim() }];
      await updateDoc(listRef, { items: updatedItems });
      setNewItem('');
    }
  };

  const moveItem = async (fromIndex, toIndex) => {
    if (!activeList) return;
    
    const items = [...activeList.items];
    const [movedItem] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, movedItem);
    
    await updateDoc(doc(db, "lists", activeListId), { items });
  };

  const deleteItem = async (index) => {
    if (!activeList) return;
    
    const items = [...activeList.items];
    items.splice(index, 1);
    
    await updateDoc(doc(db, "lists", activeListId), { items });
  };

  return (
    <DndProvider backend={isMobile ? TouchBackend : HTML5Backend} options={{ enableMouseEvents: true }}>
      <div className="container">
        <div className="header">
          <h1 className="title">Ranking Tool by https://github.com/dhruvtand7</h1>
          <button onClick={() => setIsCreatingList(true)} className="button">
            <Plus className="w-4 h-4 mr-2" />
            New List
          </button>
        </div>

        {isCreatingList && (
          <form onSubmit={addList} className="input-container">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Enter list name"
              className="input"
              autoFocus
            />
            <button type="submit" className="button">Create</button>
          </form>
        )}

        {lists.length > 0 ? (
          <>
            <div className="input-container">
              {lists.map(list => (
                <button
                  key={list.id}
                  onClick={() => setActiveListId(list.id)}
                  className={`button ${activeListId === list.id ? 'bg-blue-700' : 'bg-gray-200 text-gray-800'}`}
                >
                  {list.name}
                </button>
              ))}
            </div>

            {activeList && (
              <>
                <form onSubmit={addItem} className="input-container">
                  <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Add new item"
                    className="input"
                  />
                  <button type="submit" className="button">Add Item</button>
                </form>

                {activeList.items?.map((item, index) => (
                  <DraggableItem key={index} item={item} index={index} moveItem={moveItem} deleteItem={deleteItem} />
                ))}
              </>
            )}
          </>
        ) : (
          <p>No lists yet. Create your first list to get started!</p>
        )}
      </div>
    </DndProvider>
  );
};

export default App;
