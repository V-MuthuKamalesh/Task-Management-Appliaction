import { Worker } from 'worker_threads';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { validateTask } from '../utils/joi.js';
import redisClient from '../utils/redis.js';
import { notifyUser } from '../utils/webSocketServer.js';//websocket
const createTask = async (req, res) => {
  const { error } = validateTask(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  const { title, status, assignedTo } = req.body;
  try {
    const newTask = await prisma.task.create({
      data: {
        title,
        status,
        assignedTo,
      },
    });

    await redisClient.del('allTasks');

    res.status(200).json({
      message: 'Task created successfully',
      newTask,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

const getAllTasks = async (req, res) => {
  try {
    const cachedTasks = await redisClient.get('allTasks');
    if (cachedTasks) {
      return res.status(200).json({
        message: 'Tasks fetched successfully (from cache)',
        tasks: JSON.parse(cachedTasks),
      });
    }

    const tasks = await prisma.task.findMany();

    await redisClient.setEx('allTasks', 3600, JSON.stringify(tasks));

    res.status(200).json({
      message: 'Tasks fetched successfully',
      tasks,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

const updateTask = async (req, res) => {
  const { title } = req.params;
  const { status } = req.body;
  
  try {
    let updatedTask;
    
    if (req.user.role === 'admin') {
      updatedTask = await prisma.task.update({
        where: { title },
        data: { ...req.body },
      });
    } else {
      updatedTask = await prisma.task.update({
        where: { title },
        data: { status },
      });
    }
    
    await redisClient.del('allTasks');
    const taskOwner = updatedTask.assignedTo;//websocket
    notifyUser(taskOwner, {//websocket
      message: `Task "${updatedTask.title}" has been updated.`,//websocket
      task: updatedTask,//websocket
    });//websocket

    res.status(200).json({
      message: 'Task updated successfully',
      updatedTask,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

const deleteTask = async (req, res) => {
  const { title } = req.params;
  try {
    const deletedTask = await prisma.task.delete({
      where: { title },
    });

    await redisClient.del('allTasks');

    res.status(200).json({
      message: 'Task deleted successfully',
      deletedTask,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

const runWorkerTask = (taskType, data) =>
  new Promise((resolve, reject) => {
    const worker = new Worker('./utils/taskWorker.js', { workerData: null });

    worker.postMessage({ type: taskType, payload: data });

    worker.on('message', (message) => {
      if (message.success) {
        resolve(message.result);
      } else {
        reject(new Error(message.error));
      }
    });

    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });

const getSortedTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany(); 

    const sortedTasks = await runWorkerTask('sort', tasks);

    res.status(200).json({
      message: 'Tasks fetched and sorted successfully',
      tasks: sortedTasks,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

const getFilteredTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany(); 
    const filteredTasks = await runWorkerTask('filter', tasks);

    res.status(200).json({
      message: 'Tasks filtered successfully',
      tasks: filteredTasks,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};


export default{
  createTask,
  getAllTasks,
  updateTask,
  deleteTask,
  getSortedTasks, 
  getFilteredTasks,
};
