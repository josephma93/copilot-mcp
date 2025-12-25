class CopilotMcp < Formula
  desc "Model Context Protocol server for GitHub Copilot"
  homepage "https://github.com/josephma93/copilot-mcp"
  version "0.1.12"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/josephma93/copilot-mcp/releases/download/v0.1.12/copilot-mcp-aarch64-apple-darwin.tar.gz"
      sha256 "37e49fd2a9ff126279bfda31554df14c6283b572a6d3919af33384b2346253d8"
    else
      url "https://github.com/josephma93/copilot-mcp/releases/download/v0.1.12/copilot-mcp-x86_64-apple-darwin.tar.gz"
      sha256 "69cc71bd6f6804c986d007b4c4f46eb37e75c05cbaa426675c3a4fe400ef5f72"
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
