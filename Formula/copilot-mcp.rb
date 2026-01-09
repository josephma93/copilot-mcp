class CopilotMcp < Formula
  desc "Model Context Protocol server for GitHub Copilot"
  homepage "https://github.com/josephma93/copilot-mcp"
  version "0.1.15"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/josephma93/copilot-mcp/releases/download/v0.1.15/copilot-mcp-aarch64-apple-darwin.tar.gz"
      sha256 "17648e4819cd1e433a9f73dc622010e60ac936c1c19acd17c9a384437406fff0"
    else
      url "https://github.com/josephma93/copilot-mcp/releases/download/v0.1.15/copilot-mcp-x86_64-apple-darwin.tar.gz"
      sha256 "99272fca1ec71a22e5b6b8745cd9acf27798d1adcc00482c3c159b5efed28e61"
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
