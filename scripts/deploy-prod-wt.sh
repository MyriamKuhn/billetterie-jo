#!/usr/bin/env bash
set -euo pipefail

# 1) build
npm run build

# 2) fetch & remove old worktree if necessary
git fetch origin
if git worktree list | grep -q "prod$"; then
  git worktree remove --force prod
fi

# 3) add prod branch in ./prod
git worktree add --checkout prod production

# 4) clean the prod worktree
#    - remove all files except .git and .gitignore
pushd prod >/dev/null
  # active extglob for extended globbing
  shopt -s extglob
  # remove all files except .git and .gitignore
  rm -rf -- !(.git|.gitignore)
  shopt -u extglob
popd >/dev/null

# 5) copy the build files to the prod worktree
cp -R dist/* prod/

# 6) commit and push the changes
pushd prod >/dev/null
  git add --all
  git commit -m "chore: deploy prod $(date +'%Y-%m-%d %H:%M:%S')"
  git push origin production --force
popd >/dev/null

# 7) remove the worktree
git worktree remove --force prod

echo "✓ Déploiement sur production terminé."

