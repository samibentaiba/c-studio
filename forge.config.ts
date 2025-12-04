import type { ForgeConfig } from "@electron-forge/shared-types";
import path from "path";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { VitePlugin } from "@electron-forge/plugin-vite";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { FuseV1Options, FuseVersion } from "@electron/fuses";

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    // CRITICAL: We copy specifically the mingw64 folder
    extraResource: ["./resources/mingw64"],
    // icon: "./public/icon", // Commented out to avoid any icon issues
    
    // --- FIX: COMMENT OUT SIGNING FOR NOW ---
    // win32metadata: {
    //   'CertificateFile': './cert.pfx',
    //   'CertificatePassword': '123456'
    // }
  },
  rebuildConfig: {},
  makers: [
    // MakerSquirrel is failing with "Unable to set icon"
    // new MakerSquirrel({
    //   // Windows Installer Configuration
    //   // setupIcon: path.resolve(__dirname, "public/icon.ico"),
      
    //   // --- FIX: COMMENT OUT SIGNING FOR NOW ---
    //   // certificateFile: "./cert.pfx",
    //   // certificatePassword: "123456",
      
    //   authors: "C-Studio Team",
    //   description: "A zero-setup C IDE for beginners.",
    // }),
    new MakerZIP({}, ["darwin", "win32"]),
    new MakerDeb({}),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: "src/main.ts",
          config: "vite.main.config.ts",
          target: "main",
        },
        {
          entry: "src/preload.ts",
          config: "vite.preload.config.ts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.ts",
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;