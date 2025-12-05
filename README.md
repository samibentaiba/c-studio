# C-Studio 🚀

**The Maintenance-First, Zero-Setup C IDE for Windows.**

C-Studio is a modern, lightweight IDE designed specifically for beginners and students learning C. It eliminates the headache of installing compilers and configuring paths by bundling a portable MinGW toolchain directly into the application.

![C-Studio Screenshot](https://via.placeholder.com/800x450?text=C-Studio+Screenshot)

## ✨ Features

- **Zero Setup**: Download, install, and run. No need to install MinGW or GCC separately.
- **Bundled Compiler**: Comes with a pre-configured MinGW-w64 toolchain.
- **Modern UI**: Built with React and Tailwind CSS for a clean, dark-themed coding experience.
- **Instant Run**: Compile and execute your C code with a single click.
- **File Management**: Create, edit, and delete multiple `.c` and `.h` files.

## 🚀 Getting Started

### Installation

1.  Go to the [Releases](https://github.com/yourusername/c-studio/releases) page.
2.  Download the latest `Setup.exe` or ZIP file.
3.  Run the installer.
4.  **Windows Defender Setup** (Required once):
    - Right-click `setup-windows-defender.bat` and select **"Run as administrator"**
    - This allows Windows to trust the bundled compiler
5.  Start coding!

### Development

If you want to contribute or build from source:

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/yourusername/c-studio.git
    cd c-studio
    ```

2.  **Install dependencies**:

    ```bash
    npm install
    ```

3.  **Setup Compiler (Windows)**:
    - Download a portable MinGW-w64 distribution.
    - Extract it to `resources/mingw64` so that `resources/mingw64/bin/gcc.exe` exists.

4.  **Start the app**:

    ```bash
    npm start
    ```

5.  **Build for Production**:
    ```bash
    npm run make
    ```

## 🛠️ Tech Stack

- **Electron**: Cross-platform desktop framework.
- **React**: UI library.
- **TypeScript**: Type-safe development.
- **Vite**: Fast build tool.
- **Electron Forge**: Packaging and distribution.

## 📄 License

MIT
