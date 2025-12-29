class CopilotMcp < Formula
  desc "Model Context Protocol server for GitHub Copilot"
  homepage "https://github.com/josephma93/copilot-mcp"
  version "0.1.13"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/josephma93/copilot-mcp/releases/download/v0.1.13/copilot-mcp-aarch64-apple-darwin.tar.gz"
      sha256 "7f3a80d00fbbfaea51a0e0b0296e74fa065e91f84ea0eec1fd52736efcd0e9e4"
    else
      url "https://github.com/josephma93/copilot-mcp/releases/download/v0.1.13/copilot-mcp-x86_64-apple-darwin.tar.gz"
      sha256 "b87adb238050767558a481b03f36f6c2cdd9552c0980cc6e1bacc3d124e096f6"
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
