import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList,
  TouchableOpacity,
  Animated,
  Modal,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Main App Component
export default function App() {
  // State variables
  const [task, setTask] = useState(''); // Stores the current input task
  const [tasks, setTasks] = useState([]); // Stores the list of tasks
  const [spider] = useState(new Animated.Value(0)); // Used for animation effect when adding a task
  const [modalVisible, setModalVisible] = useState(false); // Controls visibility of the task edit modal
  const [selectedTask, setSelectedTask] = useState(null); // Tracks the task currently being edited

  // useEffect hook to load tasks from AsyncStorage when the app first loads
  useEffect(() => {
    loadTasks(); // Call loadTasks when the component mounts
  }, []);

  // Load saved tasks from AsyncStorage
  const loadTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks'); // Retrieve tasks from AsyncStorage
      if (storedTasks) setTasks(JSON.parse(storedTasks)); // If tasks exist, update state
    } catch (error) {
      console.error(error); // Log any error that occurs while fetching tasks
    }
  };

  // Save tasks to AsyncStorage
  const saveTasks = async (tasks) => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(tasks)); // Save updated tasks to AsyncStorage
    } catch (error) {
      console.error(error); // Log any error that occurs while saving tasks
    }
  };

  // Add a new task to the list
  const addTask = () => {
    if (task.trim()) {
      const newTask = { id: Date.now().toString(), text: task, completed: false }; // Create new task object
      const updatedTasks = [...tasks, newTask]; // Add new task to the tasks list
      setTasks(updatedTasks); // Update state with the new tasks list
      saveTasks(updatedTasks); // Save updated tasks to AsyncStorage
      setTask(''); // Clear input field

      // Trigger animation to indicate a new task was added
      Animated.sequence([
        Animated.timing(spider, { toValue: 1, duration: 300, useNativeDriver: true }), // Scale up animation
        Animated.timing(spider, { toValue: 0, duration: 300, useNativeDriver: true }), // Scale down animation
      ]).start(); // Start animation sequence
    } else {
      Alert.alert('Input Error', 'Task cannot be empty.'); // Show alert if input is empty
    }
  };

  // Delete a task by its id
  const deleteTask = (taskId) => {
    const updatedTasks = tasks.filter((item) => item.id !== taskId); // Remove task from the list
    setTasks(updatedTasks); // Update tasks state
    saveTasks(updatedTasks); // Save the updated task list to AsyncStorage
  };

  // Toggle task completion (mark as complete or undo completion)
  const toggleTaskCompletion = (taskId) => {
    const updatedTasks = tasks.map((item) =>
      item.id === taskId ? { ...item, completed: !item.completed } : item // Toggle completion status
    );
    setTasks(updatedTasks); // Update tasks state
    saveTasks(updatedTasks); // Save updated tasks to AsyncStorage
  };

  // Open the modal for editing a task
  const openEditModal = (task) => {
    setSelectedTask(task); // Set the task being edited
    setTask(task.text); // Pre-fill the input with the task's text
    setModalVisible(true); // Show the modal
  };

  // Save the edited task
  const editTask = () => {
    if (selectedTask) {
      const updatedTasks = tasks.map((item) =>
        item.id === selectedTask.id ? { ...item, text: task } : item // Update the text of the selected task
      );
      setTasks(updatedTasks); // Update tasks state
      saveTasks(updatedTasks); // Save the updated tasks to AsyncStorage
      setModalVisible(false); // Close the modal
      setTask(''); // Clear the input field
      setSelectedTask(null); // Clear the selected task
    }
  };

  // Animated style for task add button
  const animatedStyle = {
    transform: [
      {
        scale: spider.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.2], // Slightly grow when animation is triggered
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>To-Do List</Text> {/* Display app title */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input} // Style for the input field
          placeholder="Add a new task" // Placeholder text for input
          value={task} // Bind input value to the task state
          onChangeText={(text) => setTask(text)} // Update task state on text change
        />
        <TouchableOpacity style={styles.addButton} onPress={addTask}> {/* Add task button */}
          <Animated.Text style={[styles.addButtonText, animatedStyle]}>+</Animated.Text> {/* Animated plus sign */}
        </TouchableOpacity>
      </View>
      
      {/* List of tasks */}
      <FlatList
        data={tasks} // Pass tasks as the data for the FlatList
        renderItem={({ item }) => (
          <Animated.View style={styles.taskContainer}> {/* Animated task container */}
            <TouchableOpacity onPress={() => openEditModal(item)}> {/* Task text is clickable for editing */}
              <Text
                style={[
                  styles.taskText,
                  item.completed && styles.completedTaskText, // Strike-through if completed
                  item.completed && { color: '#808080' }, // Change color to gray for completed tasks
                ]}
              >
                {item.text} {/* Display task text */}
              </Text>
            </TouchableOpacity>
            <View style={styles.taskButtons}>
              {/* Buttons to complete or delete task */}
              <TouchableOpacity onPress={() => toggleTaskCompletion(item.id)}>
                <Text style={styles.completeButton}>
                  {item.completed ? 'Undo' : 'Complete'} {/* Toggle between Complete and Undo */}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteTask(item.id)}>
                <Text style={styles.deleteButton}>Delete</Text> {/* Button to delete task */}
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
        keyExtractor={(item) => item.id} // Unique key for each item in the list
      />

      {/* Modal for editing tasks */}
      <Modal
        visible={modalVisible} // Control modal visibility
        transparent={true} // Transparent background
        animationType="slide" // Slide-in animation for modal
        onRequestClose={() => setModalVisible(false)} // Close modal on back press
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Edit Task</Text> {/* Modal title */}
          <TextInput
            style={styles.modalInput} // Input field for editing task
            value={task} // Bind input value to task state
            onChangeText={(text) => setTask(text)} // Update task state on text change
            placeholder="Edit your task"
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.saveButton} onPress={editTask}> {/* Save edited task */}
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}> {/* Cancel edit */}
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Styles for the application
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4682b4',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#d3d3d3',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  addButton: {
    backgroundColor: '#4682b4',
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    marginLeft: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  taskContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskText: {
    fontSize: 16,
    color: '#333',
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
  },
  taskButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completeButton: {
    color: '#4682b4',
    marginRight: 10,
  },
  deleteButton: {
    color: '#ff4500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff',
  },
  modalInput: {
    width: '80%',
    height: 40,
    borderColor: '#fff',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
  },
  saveButton: {
    backgroundColor: '#4682b4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginRight: 10,
  },
  cancelButton: {
    backgroundColor: '#808080',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
