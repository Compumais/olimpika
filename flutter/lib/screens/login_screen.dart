import 'package:flutter/material.dart';
import 'package:olimpika_flutter/models/app_user.dart';
import 'package:olimpika_flutter/services/auth_service.dart';

enum AuthMode { login, register, forgotPassword }

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.authService, required this.onAuthenticated});

  final AuthService authService;
  final ValueChanged<AppUser> onAuthenticated;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  AuthMode _mode = AuthMode.login;
  String _userType = 'aluno';
  bool _loading = false;
  String? _message;
  String? _error;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmPasswordCtrl.dispose();
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() {
      _loading = true;
      _error = null;
      _message = null;
    });
    try {
      if (_mode == AuthMode.login) {
        final user = await widget.authService.login(
          _emailCtrl.text.trim().toLowerCase(),
          _passwordCtrl.text.trim(),
        );
        if (!mounted) return;
        widget.onAuthenticated(user);
      } else if (_mode == AuthMode.register) {
        if (_passwordCtrl.text.trim() != _confirmPasswordCtrl.text.trim()) {
          throw Exception('As senhas nao coincidem.');
        }
        final user = await widget.authService.register(
          fullName: _nameCtrl.text.trim(),
          email: _emailCtrl.text.trim().toLowerCase(),
          password: _passwordCtrl.text.trim(),
          userType: _userType,
        );
        if (!mounted) return;
        widget.onAuthenticated(user);
      } else {
        if (_passwordCtrl.text.trim() != _confirmPasswordCtrl.text.trim()) {
          throw Exception('As senhas nao coincidem.');
        }
        await widget.authService.resetPassword(
          _emailCtrl.text.trim().toLowerCase(),
          _passwordCtrl.text.trim(),
        );
        if (!mounted) return;
        setState(() {
          _mode = AuthMode.login;
          _message = 'Senha atualizada com sucesso.';
        });
      }
    } catch (e) {
      setState(() => _error = e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = switch (_mode) {
      AuthMode.login => 'Entrar',
      AuthMode.register => 'Cadastrar',
      AuthMode.forgotPassword => 'Redefinir senha',
    };

    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 460),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('OLIMPIKA', style: Theme.of(context).textTheme.headlineMedium),
                  const SizedBox(height: 4),
                  Text(title, style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 20),
                  if (_mode != AuthMode.login) ...[
                    TextFormField(
                      controller: _nameCtrl,
                      decoration: const InputDecoration(labelText: 'Nome completo'),
                      validator: (value) {
                        if (_mode == AuthMode.login || _mode == AuthMode.forgotPassword) {
                          return null;
                        }
                        if (value == null || value.trim().isEmpty) return 'Informe o nome.';
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),
                  ],
                  TextFormField(
                    controller: _emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(labelText: 'Email'),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) return 'Informe o email.';
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _passwordCtrl,
                    obscureText: true,
                    decoration: InputDecoration(
                      labelText: _mode == AuthMode.forgotPassword ? 'Nova senha' : 'Senha',
                    ),
                    validator: (value) {
                      if (value == null || value.trim().length < 6) {
                        return 'A senha deve ter no minimo 6 caracteres.';
                      }
                      return null;
                    },
                  ),
                  if (_mode != AuthMode.login) ...[
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _confirmPasswordCtrl,
                      obscureText: true,
                      decoration: const InputDecoration(labelText: 'Confirmar senha'),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Confirme a senha.';
                        }
                        return null;
                      },
                    ),
                  ],
                  if (_mode == AuthMode.register) ...[
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: _userType,
                      decoration: const InputDecoration(labelText: 'Tipo de usuario'),
                      items: const [
                        DropdownMenuItem(value: 'aluno', child: Text('Aluno')),
                        DropdownMenuItem(value: 'personal', child: Text('Personal')),
                      ],
                      onChanged: (value) => setState(() => _userType = value ?? 'aluno'),
                    ),
                  ],
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Text(_error!, style: const TextStyle(color: Colors.redAccent)),
                  ],
                  if (_message != null) ...[
                    const SizedBox(height: 12),
                    Text(_message!, style: const TextStyle(color: Colors.greenAccent)),
                  ],
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: _loading ? null : _submit,
                    child: _loading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Text(title),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 12,
                    children: [
                      TextButton(
                        onPressed: _loading ? null : () => setState(() => _mode = AuthMode.login),
                        child: const Text('Login'),
                      ),
                      TextButton(
                        onPressed: _loading ? null : () => setState(() => _mode = AuthMode.register),
                        child: const Text('Cadastro'),
                      ),
                      TextButton(
                        onPressed: _loading ? null : () => setState(() => _mode = AuthMode.forgotPassword),
                        child: const Text('Esqueci a senha'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
