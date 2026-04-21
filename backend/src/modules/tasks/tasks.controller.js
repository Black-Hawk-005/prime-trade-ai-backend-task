const prisma = require('../../lib/prisma');
const AppError = require('../../utils/AppError');
const { sendSuccess } = require('../../utils/response');

const getTasks = async (req, res, next) => {
  try {
    const { status, priority, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    // Regular users only see their own tasks; admins see all
    if (req.user.role !== 'ADMIN') {
      where.userId = req.user.id;
    }
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return sendSuccess(res, 200, 'Tasks fetched successfully', {
      tasks,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!task) {
      return next(new AppError('Task not found.', 404));
    }

    if (req.user.role !== 'ADMIN' && task.userId !== req.user.id) {
      return next(new AppError('Access denied.', 403));
    }

    return sendSuccess(res, 200, 'Task fetched successfully', { task });
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        dueDate,
        userId: req.user.id,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return sendSuccess(res, 201, 'Task created successfully', { task });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;

    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return next(new AppError('Task not found.', 404));
    }

    if (req.user.role !== 'ADMIN' && existing.userId !== req.user.id) {
      return next(new AppError('Access denied.', 403));
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { title, description, status, priority, dueDate },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return sendSuccess(res, 200, 'Task updated successfully', { task });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return next(new AppError('Task not found.', 404));
    }

    if (req.user.role !== 'ADMIN' && existing.userId !== req.user.id) {
      return next(new AppError('Access denied.', 403));
    }

    await prisma.task.delete({ where: { id: req.params.id } });

    return sendSuccess(res, 200, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, getTaskById, createTask, updateTask, deleteTask };
