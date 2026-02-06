{
  description = "Project GAIA development shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            bun
            nodejs_22
          ];

          shellHook = ''
            echo "Project GAIA dev shell (pre-alpha)"
            echo "Run: bun install && bun run check"
          '';
        };
      }
    );
}
