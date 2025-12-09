class CopilotMcp < Formula
  desc "Model Context Protocol server for GitHub Copilot"
  homepage "https://github.com/josephma93/copilot-mcp"
  version "{{VERSION}}"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/josephma93/copilot-mcp/releases/download/{{TAG}}/copilot-mcp-aarch64-apple-darwin.tar.gz"
      sha256 "{{SHA_ARM64}}"
    else
      url "https://github.com/josephma93/copilot-mcp/releases/download/{{TAG}}/copilot-mcp-x86_64-apple-darwin.tar.gz"
      sha256 "{{SHA_X64}}"
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
