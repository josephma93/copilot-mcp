class CopilotMcp < Formula
  desc "Model Context Protocol server for GitHub Copilot"
  homepage "https://github.com/josephma93/copilot-mcp"
  version "0.1.11"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/josephma93/copilot-mcp/releases/download/v0.1.11/copilot-mcp-aarch64-apple-darwin.tar.gz"
      sha256 "1f2ecbdc1b236988383b5658efd8a1521294eb4820478cefd4b8bfe944ec5259"
    else
      url "https://github.com/josephma93/copilot-mcp/releases/download/v0.1.11/copilot-mcp-x86_64-apple-darwin.tar.gz"
      sha256 "fd71cfb7454a321d49c17e8597830b202f0cc4a1b29238abb0dbc43d0f85a0c7"
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
