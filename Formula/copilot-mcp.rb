class CopilotMcp < Formula
  desc "Model Context Protocol server for GitHub Copilot"
  homepage "https://github.com/josephma93/copilot-mcp"
  version "0.1.8"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/josephma93/copilot-mcp/releases/download/v0.1.8/copilot-mcp-aarch64-apple-darwin.tar.gz"
      sha256 "5410417e25b77117316183c86b8b6c6ce4c10854e88db2b61c9309f68602d84c"
    else
      url "https://github.com/josephma93/copilot-mcp/releases/download/v0.1.8/copilot-mcp-x86_64-apple-darwin.tar.gz"
      sha256 "c391c2740bce47af51f28e7b46be2c1d30173fae99fe4b10a87569341f808e6b"
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
