import UserService from '../services/userService.js';

class UsersController {
  static list = async (req, res) => {
    const users = await UserService.listUsers();
    res.json({
      success: true,
      data: users,
    });
  };

  static me = async (req, res) => {
    const user = await UserService.getMe(req.auth.userId);
    res.json({
      success: true,
      data: user,
    });
  };

  static create = async (req, res) => {
    const user = await UserService.createUser(req.validated);
    res.status(201).json({
      success: true,
      data: user,
    });
  };
}

export default UsersController;
