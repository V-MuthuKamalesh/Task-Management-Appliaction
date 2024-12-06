import { PrismaClient } from '@prisma/client';
import redisClient from '../utils/redis.js';
import { hashPassword, comparePassword } from '../utils/bcrypt.js';
import { validateUser } from '../utils/joi.js';
import { generateToken } from '../utils/jwt.js';

const prisma = new PrismaClient();

const register = async (req, res) => {
  const { error } = validateUser(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { name, email, password, role } = req.body;

  try {
    const exists = await prisma.user.findUnique({ where: { username: name } });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: { username: name, email, password: hashedPassword, role },
    });

    res.status(201).json({ message: 'User registered successfully', newUser });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isValid = await comparePassword(password, user.password);
    if (!isValid) return res.status(401).json({ message: 'Invalid password' });

    const token = generateToken(user);

    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const findall = async (req, res) => {
  try {
    const cachedUsers = await redisClient.get('allUsers');
    if (cachedUsers) {
      return res.status(200).json({
        message: 'Users fetched successfully (from cache)',
        users: JSON.parse(cachedUsers),
      });
    }
    const users = await prisma.user.findMany();
    await redisClient.setEx('allUsers', 3600, JSON.stringify(users));
    res.status(200).json({ message: 'Users fetched successfully', users });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const findbyname = async (req, res) => {
  try {
    const { name } = req.params;

    const cachedUser = await redisClient.get(`user:${name}`);
    if (cachedUser) {
      return res.status(200).json({
        message: 'User found (from cache)',
        user: JSON.parse(cachedUser),
      });
    }

    const user = await prisma.user.findUnique({ where: { username:name } });

    if (!user) return res.status(404).json({ message: 'User not found' });

    await redisClient.setEx(`user:${name}`, 3600, JSON.stringify(user));

    res.status(200).json({ message: 'User found', user });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const gettasks = async (req, res) => {
  try {
    const { name } = req.params;

    const cachedTasks = await redisClient.get(`tasks:${name}`);
    if (cachedTasks) {
      return res.status(200).json({
        message: 'Tasks fetched successfully (from cache)',
        tasks: JSON.parse(cachedTasks),
      });
    }

    const user = await prisma.user.findUnique({ where: { username: name } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const tasks = await prisma.task.findMany({
      where: { assignedTo: name },
    });

    await redisClient.setEx(`tasks:${name}`, 3600, JSON.stringify(tasks)); 

    res.status(200).json({
      message: 'Tasks fetched successfully',
      tasks,
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
};


const updateuser = async (req, res) => {
  try {
    const { name } = req.params;
    if (req.body.password) {
      req.body.password = await hashPassword(req.body.password);
    }
    const updatedUser = await prisma.user.update({
      where: { username:name },
      data: req.body,
    });
    await redisClient.del('allUsers');
    await redisClient.del(`user:${name}`);

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const deleteuser = async (req, res) => {
  try {
    const { name } = req.params;

    const deletedUser = await prisma.user.delete({ where: { username:name } });

    await redisClient.del('allUsers');
    await redisClient.del(`user:${name}`);

    res.status(200).json({ message: 'User deleted', deletedUser });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export default { register, login, findall, findbyname, updateuser, deleteuser, gettasks };
