class Memorix < Formula
    version "{{{VERSION}}}"
  
    if Hardware::CPU.intel?
        url "https://github.com/uvop/memorix/releases/download/v#{version}/memorix-macos-x64.tar.gz"
        sha256 "{{{INTEL_SHA}}}"
    else
        url "https://github.com/uvop/memorix/releases/download/v#{version}/memorix-macos-x64.tar.gz"
        sha256 "{{{M1_SHA}}}"
    end
  
    desc "Memorix - CLI"
    homepage "https://github.com/uvop/memorix"
  
    def install
        bin.install "memorix"
    end
end