#!/bin/bash

# Setup a machine on Paperspace, clone a repo, checkout a branch and run all tests on it.
# This is useful to make sure that everything is working on a machine with an Nvidia GPU with enough VRAM.
# Intended to run on Ubuntu 22.04.
#
# Run this script with this command:
# bash -c "$(curl -fsSL https://raw.githubusercontent.com/withcatai/node-llama-cpp/beta/test/utils/setupAndTestOnPaperspace.sh)"


defaultRepo="withcatai/node-llama-cpp"
targetFolder=$HOME/workspace/test-node-llama-cpp
nodejsVersion=21


colorYellow=$'\e[33m'
colorBlue=$'\e[34m'
colorGrey=$'\e[90m'
colorEnd=$'\e[0m'


# Ensure that running on Ubuntu 22.04
if [ ! -f /etc/os-release ] || ! grep -q 'NAME="Ubuntu"' /etc/os-release || ! grep -q 'VERSION_ID="22.04"' /etc/os-release || ! which apt>/dev/null; then
    echo "This script is intended to run on Ubuntu 22.04"
    read -r -n 1 -p "${colorYellow}Are you sure you want to continue?${colorEnd} ${colorGrey}(y/n)${colorEnd} " continueScript
    if [[ ! $continueScript =~ ^[Yy]$ ]]; then
        echo "Aborting script..."
        exit 1
    fi
fi

# Ensure that running on Paperspace
if [ "$USER" != "paperspace" ]; then
    echo "This script is intended to run on Paperspace"
    read -r -n 1 -p "${colorYellow}Are you sure you want to continue?${colorEnd} ${colorGrey}(y/n)${colorEnd} " continueScript
    if [[ ! $continueScript =~ ^[Yy]$ ]]; then
        echo "Aborting script..."
        exit 1
    fi
fi

echo "Setting things up..."

# Prevent the machine from upgrading itself for the short time it lives for this script, as it's completely unnecessary and time wasting.
NEEDRESTART_MODE=a sudo apt remove -y -qq unattended-upgrades>/dev/null 2>&1

# Install dependencies
NEEDRESTART_MODE=a sudo apt update -qq>/dev/null 2>&1
NEEDRESTART_MODE=a sudo apt install -y -qq git git-lfs fzf>/dev/null 2>&1


# Receive input from the user regarding the repo and branch to clone and checkout
read -r -p "${colorYellow}GitHub repo to clone:${colorEnd} ${colorGrey}($defaultRepo)${colorEnd} " githubRepo
githubRepo=${githubRepo:-$defaultRepo}

githubRepoAvailableBranches=$(git ls-remote --heads https://github.com/$githubRepo | cut -d/ -f3-)
githubRepoBranch=$(echo "$githubRepoAvailableBranches" | fzf --prompt="${colorYellow}Branch to checkout:${colorEnd} ")
echo "${colorYellow}Branch to checkout:${colorEnd} $githubRepoBranch"

if [ -z "$githubRepoBranch" ]; then
    echo "No branch selected. Aborting script..."
    exit 1
fi


# Clone the repo and checkout the branch
echo "Cloning ${colorBlue}$githubRepo${colorEnd} and checking out ${colorBlue}$githubRepoBranch${colorEnd}..."
echo ""
rm -rf "$targetFolder"
mkdir -p "$(dirname "$targetFolder")"
git clone "https://github.com/$githubRepo" "$targetFolder"
pushd "$targetFolder" || exit 1
git checkout "$githubRepoBranch"
popd || exit 1
echo ""
echo ""

# Setup the machine
echo "Setting up the machine..."
NEEDRESTART_MODE=a sudo apt install -y -qq ca-certificates curl gnupg libvulkan-dev zsh

# Install zsh
CHSH=no RUNZSH=no sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)">/dev/null
sudo chsh -s "$(which zsh)"
sudo chsh -s "$(which zsh)" "$USER"

# Add Node.js repository
mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${nodejsVersion}.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list

# Add Vulkan repository
wget -qO - https://packages.lunarg.com/lunarg-signing-key-pub.asc | sudo apt-key add -
sudo wget -qO /etc/apt/sources.list.d/lunarg-vulkan-jammy.list https://packages.lunarg.com/vulkan/lunarg-vulkan-jammy.list

# Add Nvidia repository
mkdir -p "$targetFolder/.tempMachineSetup"
pushd "$targetFolder/.tempMachineSetup" || exit 1
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.1-1_all.deb
sudo dpkg -i cuda-keyring_1.1-1_all.deb
popd || exit 1
rm -rf "$targetFolder/.tempMachineSetup"

# Install dependencies
NEEDRESTART_MODE=a sudo apt update -qq
NEEDRESTART_MODE=a sudo apt install -y -qq nodejs
NEEDRESTART_MODE=a sudo apt install -y -qq vulkan-sdk
NEEDRESTART_MODE=a sudo apt install -y -qq cuda-toolkit-12-3
NEEDRESTART_MODE=a sudo apt install -y -qq cuda-drivers

nvidia-smi>/dev/null # make sure that the Nvidia driver is installed and working
vulkaninfo | grep -i "device id" | head -n 1


# Run npm install and prepare repo
echo "Preparing the repo..."
pushd "$targetFolder" || exit 1
npm install
npm run dev:setup

# Run tests and start a loop of running tests and pulling from git
echo "Starting a loop of running ${colorBlue}npm test${colorEnd} and then pulling from git when the user presses Enter..."
while true; do
    echo "Running tests using CUDA..."
    NODE_LLAMA_CPP_GPU=cuda npm test

    echo "Running tests using Vulkan..."
    NODE_LLAMA_CPP_GPU=vulkan npm test

    echo ""
    echo "Done running tests"
    read -r -s "Press Enter to pull from git and rerun the tests, or Ctrl+C to exit"
    git pull
done
