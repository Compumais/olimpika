import 'package:flutter/material.dart';
import 'package:olimpika_flutter/models/app_user.dart';
import 'package:olimpika_flutter/screens/home_screen.dart';
import 'package:olimpika_flutter/screens/login_screen.dart';
import 'package:olimpika_flutter/screens/placeholder_screen.dart';
import 'package:olimpika_flutter/services/auth_service.dart';

class RootShell extends StatefulWidget {
  const RootShell({super.key, required this.authService});

  final AuthService authService;

  @override
  State<RootShell> createState() => _RootShellState();
}

class _RootShellState extends State<RootShell> {
  AppUser? _user;
  bool _restoring = true;
  int _tabIndex = 0;

  @override
  void initState() {
    super.initState();
    _restore();
  }

  Future<void> _restore() async {
    await widget.authService.restoreUser();
    if (!mounted) return;
    setState(() {
      _user = widget.authService.user;
      _restoring = false;
    });
  }

  Future<void> _logout() async {
    await widget.authService.logout();
    if (!mounted) return;
    setState(() {
      _user = null;
      _tabIndex = 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_restoring) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (_user == null) {
      return LoginScreen(
        authService: widget.authService,
        onAuthenticated: (user) => setState(() => _user = user),
      );
    }

    final pages = _buildPages(_user!);
    final current = pages[_tabIndex.clamp(0, pages.length - 1)];

    return Scaffold(
      appBar: AppBar(
        title: Text(current.title),
        actions: [
          IconButton(
            onPressed: _logout,
            icon: const Icon(Icons.logout),
            tooltip: 'Sair',
          ),
        ],
      ),
      body: current.child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tabIndex,
        onDestinationSelected: (value) => setState(() => _tabIndex = value),
        destinations: pages
            .map((page) => NavigationDestination(icon: Icon(page.icon), label: page.title))
            .toList(),
      ),
    );
  }

  List<_NavPage> _buildPages(AppUser user) {
    final alunoPages = [
      _NavPage(
        title: 'Home',
        icon: Icons.home_outlined,
        child: HomeScreen(user: user),
      ),
      _NavPage(
        title: 'History',
        icon: Icons.calendar_month_outlined,
        child: const PlaceholderScreen(
          title: 'History',
          description: 'Equivalente a pagina History do projeto React.',
        ),
      ),
      _NavPage(
        title: 'ManageWorkouts',
        icon: Icons.fitness_center_outlined,
        child: const PlaceholderScreen(
          title: 'ManageWorkouts',
          description: 'Tela placeholder para gerenciamento de treinos.',
        ),
      ),
      _NavPage(
        title: 'Profile',
        icon: Icons.person_outline,
        child: PlaceholderScreen(
          title: 'Profile',
          description: 'Usuario atual: ${user.fullName} (${user.email})',
        ),
      ),
    ];

    final personalPages = [
      _NavPage(
        title: 'PersonalHome',
        icon: Icons.space_dashboard_outlined,
        child: const PlaceholderScreen(
          title: 'PersonalHome',
          description: 'Area inicial para Personal/Admin.',
        ),
      ),
      _NavPage(
        title: 'ManageStudents',
        icon: Icons.groups_outlined,
        child: const PlaceholderScreen(
          title: 'ManageStudents',
          description: 'Lista e gerenciamento de alunos.',
        ),
      ),
      _NavPage(
        title: 'WorkoutTemplates',
        icon: Icons.copy_all_outlined,
        child: const PlaceholderScreen(
          title: 'WorkoutTemplates',
          description: 'Templates de treino para atribuicao aos alunos.',
        ),
      ),
      _NavPage(
        title: 'Profile',
        icon: Icons.person_outline,
        child: PlaceholderScreen(
          title: 'Profile',
          description: 'Usuario atual: ${user.fullName} (${user.email})',
        ),
      ),
    ];

    return user.isPersonalOrAdmin ? personalPages : alunoPages;
  }
}

class _NavPage {
  const _NavPage({
    required this.title,
    required this.icon,
    required this.child,
  });

  final String title;
  final IconData icon;
  final Widget child;
}
