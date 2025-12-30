class CopilotMcp < Formula
  desc "Model Context Protocol server for GitHub Copilot"
  homepage "https://github.com/josephma93/copilot-mcp"
  version "0.1.14"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/josephma93/copilot-mcp/releases/download/v0.1.14/copilot-mcp-aarch64-apple-darwin.tar.gz"
      sha256 "4a94ed5e3836e306769f1389a7534cb0d583b0e26dfefa79e0d2231239a9923e"
    else
      url "https://github.com/josephma93/copilot-mcp/releases/download/v0.1.14/copilot-mcp-x86_64-apple-darwin.tar.gz"
      sha256 "ba72f2cc435de382d8e7f534e7d1bb65834529d20e44178ea50f4650a684901d"
    end
  end

  def install
    binary = if Hardware::CPU.arm?
      "copilot-mcp-aarch64-apple-darwin"
    else
      "copilot-mcp-x86_64-apple-darwin"
    end
    bin.install binary => "copilot-mcp"
  end

  test do
    assert_match "copilot-mcp", shell_output("#{bin}/copilot-mcp --help")
  end
end
