class CopilotMcp < Formula
  desc "Model Context Protocol server for GitHub Copilot"
  homepage "https://github.com/josephma93/copilot-mcp"
  version "0.1.9"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/josephma93/copilot-mcp/releases/download/v0.1.9/copilot-mcp-aarch64-apple-darwin.tar.gz"
      sha256 "a5decac5bc4be3531e6e22f1e22481bcde13d2cbea9586537cb41f504bfae8f5"
    else
      url "https://github.com/josephma93/copilot-mcp/releases/download/v0.1.9/copilot-mcp-x86_64-apple-darwin.tar.gz"
      sha256 "af2f46aa08f0d7613639a63febe7a9aef07830a96f3e05f5f3e78ff5509cbdc0"
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
