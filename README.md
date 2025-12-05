# C-Studio 🚀

**The Zero-Setup C IDE for Windows - Perfect for Beginners!**

C-Studio is a modern, lightweight IDE designed for beginners and students learning C. It eliminates the headache of installing compilers and configuring paths by bundling a portable MinGW toolchain directly into the application.

![C-Studio Screenshot](./public/readme.png)

## ✨ Features

- **Zero Setup** - No need to install MinGW or GCC separately
- **Bundled Compiler** - Pre-configured MinGW-w64 toolchain included
- **Modern UI** - Clean, dark-themed coding experience
- **Instant Run** - Compile and execute with a single click
- **Interactive Terminal** - Full `scanf` and input support

---

## 📥 Installation (Users)

### Step 1: Download
Go to the [Releases](https://github.com/samibentaiba/c-studio/releases) page and download the latest **ZIP file**.

### Step 2: Extract
Extract the ZIP to a folder, for example:
```
C:\C-Studio\
```

### Step 3: Install Shortcuts
1. Open the `resources` folder
2. **Double-click** `install.bat`
3. This creates:
   - ✅ Desktop shortcut
   - ✅ Start Menu entry (searchable in Windows)

### Step 4: Allow Windows Defender (Required Once)
1. In the `resources` folder, find `setup-windows-defender.bat`
2. **Right-click** → **"Run as administrator"**
3. Click "Yes" when prompted
4. Wait for "SUCCESS" message

### Step 5: Start Coding! 🎉
- Search **"C-Studio"** in Windows Start Menu, or
- Double-click the Desktop shortcut

---

## �️ Uninstall

To remove C-Studio:

1. Go to the `resources` folder
2. Double-click `uninstall.bat`
3. Delete the C-Studio folder

---

## �📁 Package Contents

```
c-studio-win32-x64/
├── c-studio.exe                    ← Main application
├── resources/
│   ├── install.bat                 ← Creates shortcuts
│   ├── uninstall.bat               ← Removes shortcuts
│   ├── setup-windows-defender.bat  ← Windows Defender fix
│   └── mingw64/                    ← Bundled GCC compiler
└── ... (other files)
```


---

## 🔧 Development

If you want to contribute or build from source:

### Prerequisites
- Node.js 18+
- Bun or npm

### Setup

```bash
# Clone the repository
git clone https://github.com/samibentaiba/c-studio.git
cd c-studio

# Install dependencies
bun install  # or: npm install

# Download MinGW-w64 and extract to resources/mingw64
# Ensure resources/mingw64/bin/gcc.exe exists

# Start development
bun run start  # or: npm start

# Build for production
bun run make  # or: npm run make
```

### Build Output
After running `bun run make`, the distributable files are in:
- `out/make/zip/win32/x64/` - ZIP package

---

## 🛠️ Tech Stack

- **Electron** - Desktop framework
- **React** - UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **Monaco Editor** - VS Code's editor
- **Electron Forge** - Packaging

---

## 📄 License

MIT © Sami Bentaiba
