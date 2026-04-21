const prisma = require('../../lib/prisma');
const AppError = require('../../utils/AppError');
const { sendSuccess } = require('../../utils/response');

const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    return sendSuccess(res, 200, 'Users fetched successfully', {
      users,
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

const getUserById = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        tasks: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, status: true, priority: true, dueDate: true },
        },
      },
    });

    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    return sendSuccess(res, 200, 'User fetched successfully', { user });
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['USER', 'ADMIN'].includes(role)) {
      return next(new AppError('Role must be USER or ADMIN.', 400));
    }

    if (req.params.id === req.user.id) {
      return next(new AppError('You cannot change your own role.', 400));
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    return sendSuccess(res, 200, 'User role updated successfully', { user });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return next(new AppError('You cannot delete your own account.', 400));
    }

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return next(new AppError('User not found.', 404));
    }

    await prisma.user.delete({ where: { id: req.params.id } });

    return sendSuccess(res, 200, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, getUserById, updateUserRole, deleteUser };
