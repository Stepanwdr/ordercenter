import AuthService from '../services/authService.js';

class AuthController {
  static register = async (req, res) => {
    const result = await AuthService.register(req.validated);
    res.status(201).json({
      success: true,
      data: result,
    });
  };

  static login = async (req, res) => {
    const result = await AuthService.login(req.validated);
    res.json({
      success: true,
      data: result,
    });
  };

  static refresh = async (req, res) => {
    const result = await AuthService.refresh(req.validated.refreshToken);
    res.json({
      success: true,
      data: result,
    });
  };
}

export default AuthController;
