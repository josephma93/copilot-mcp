class CopilotMcp < Formula
  desc "Model Context Protocol server for GitHub Copilot"
  homepage "https://github.com/josephma93/copilot-mcp"
  version "0.1.5"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/josephma93/copilot-mcp/releases/download/v0.1.5/copilot-mcp-aarch64-apple-darwin.tar.gz"
      sha256 "7fcb9c371696272292dabe12c3489e09eccc66ad993aced14875ac40d6eb91ab"
    else
      url "https://github.com/josephma93/copilot-mcp/releases/download/v0.1.5/copilot-mcp-x86_64-apple-darwin.tar.gz"
      sha256 "0b5bd5a3bb1597f42058eab178500518c80e5e8182d2677cbc8d9ebfdeb35cfe"
    end
  end

  def install
    bin.install "copilot-mcp"
  end

  test do
    assert_match "copilot-mcp", shell_output("#{bin}/copilot-mcp --help")
  end
end
