class CopilotMcp < Formula
  desc "Model Context Protocol server for GitHub Copilot"
  homepage "https://github.com/josephma93/copilot-mcp"
  version "0.1.10"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/josephma93/copilot-mcp/releases/download/v0.1.10/copilot-mcp-aarch64-apple-darwin.tar.gz"
      sha256 "25392a4f9b861e342297e100ed2157929a6eddc9a2c5a69eecda6b43355cd7b2"
    else
      url "https://github.com/josephma93/copilot-mcp/releases/download/v0.1.10/copilot-mcp-x86_64-apple-darwin.tar.gz"
      sha256 "3d7cb124097869111d904ffab1b6c585717e6966b6226f68181c4d3fbfa6e82a"
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
