import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class ReactWebAppScreen extends StatefulWidget {
  const ReactWebAppScreen({
    super.key,
    required this.initialUrl,
  });

  /// URL do front em React (ex: http://10.0.2.2:5173/ ou https://seu-dominio.com)
  final String initialUrl;

  @override
  State<ReactWebAppScreen> createState() => _ReactWebAppScreenState();
}

class _ReactWebAppScreenState extends State<ReactWebAppScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (_) {
            if (mounted) {
              setState(() {
                _isLoading = false;
              });
            }
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.initialUrl));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Olimpika Fitness (web)'),
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            const Center(
              child: CircularProgressIndicator(),
            ),
        ],
      ),
    );
  }
}

