const process = require('process');
const core = require('@actions/core');
const exec = require('@actions/exec');

async function run() {
    try {
        const requestedVersion = core.getInput('opencv-version') || '4.0.0';
        const fetchFromRepo = requestedVersion == 'master' ||
                              requestedVersion == 'dev'    ||
                              requestedVersion == 'latest' ||
                              requestedVersion == 'last';

        const version = fetchFromRepo ? 'last' : requestedVersion;
        const extraModules = core.getInput('opencv-extra-modules') == 'true';
        const installDeps = core.getInput('install-deps') == undefined || core.getInput('install-deps') == 'true';
        const opencvFolder = 'opencv' + (fetchFromRepo ? '' : '-' + version);

        const CMAKE_CXX_COMPILER         = core.getInput('CMAKE_CXX_COMPILER');
        const CMAKE_INSTALL_PREFIX       = core.getInput('CMAKE_INSTALL_PREFIX');
        const WITH_TBB                   = core.getInput('WITH_TBB');
        const WITH_IPP                   = core.getInput('WITH_IPP');
        const BUILD_NEW_PYTHON_SUPPORT   = core.getInput('BUILD_NEW_PYTHON_SUPPORT');
        const WITH_V4L                   = core.getInput('WITH_V4L');
        const ENABLE_PRECOMPILED_HEADERS = core.getInput('ENABLE_PRECOMPILED_HEADERS');
        const INSTALL_C_EXAMPLES         = core.getInput('INSTALL_C_EXAMPLES');
        const INSTALL_PYTHON_EXAMPLES    = core.getInput('INSTALL_PYTHON_EXAMPLES');
        const BUILD_EXAMPLES             = core.getInput('BUILD_EXAMPLES');
        const WITH_QT                    = core.getInput('WITH_QT');
        const WITH_OPENGL                = core.getInput('WITH_OPENGL');

        if (installDeps) {
            await exec.exec('sudo add-apt-repository "deb http://security.ubuntu.com/ubuntu xenial-security main"');
            await exec.exec('sudo apt-get update');
            await exec.exec('sudo apt-get remove x264 libx264-dev -y');
            await exec.exec('sudo apt-get install -y ' +
                'build-essential checkinstall cmake pkg-config yasm ' +
                'git gfortran libjpeg8-dev libjasper1 libjasper-dev libpng-dev ' +
                'libavcodec-dev libavformat-dev libswscale-dev libdc1394-22-dev ' +
                'libxine2-dev libv4l-dev ' +
                'libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev ' +
                'qt5-default libgtk2.0-dev libtbb-dev ' +
                'libatlas-base-dev ' +
                'libfaac-dev libmp3lame-dev libtheora-dev ' +
                'libvorbis-dev libxvidcore-dev ' +
                'libopencore-amrnb-dev libopencore-amrwb-dev ' +
                'libtbb2 libtiff-dev ' +
                'python-dev python-numpy ' +
                'x264 v4l-utils '
            );
        }

        if(fetchFromRepo) {
            // Fetch source from repo
            await exec.exec(`git clone https://github.com/opencv/opencv.git opencv-${version}`);
            if(extraModules) {
                await exec.exec(`git clone https://github.com/opencv/opencv_contrib.git opencv_contrib-${version}`);
            }
        } else {
            // Download sources from archive
            await exec.exec(`curl -sL https://github.com/opencv/opencv/archive/${version}.zip > opencv.zip`);
            await exec.exec('unzip -q opencv.zip');
            
            if(extraModules) {
                await exec.exec(`curl -sL https://github.com/opencv/opencv_contrib/archive/${version}.zip > opencv_contrib.zip`);
                await exec.exec('unzip -q opencv_contrib.zip');
            }
        }
      
        await exec.exec(`cmake -S opencv-${version} -B opencv-${version}/build ` +
            `-D CMAKE_CXX_COMPILER=${CMAKE_CXX_COMPILER} ` + 
            '-D CMAKE_INSTALL_PREFIX=${CMAKE_INSTALL_PREFIX}  ' + 
            '-D WITH_TBB=${WITH_TBB}  ' + 
            '-D WITH_IPP=${WITH_IPP}  ' + 
            '-D BUILD_NEW_PYTHON_SUPPORT=${BUILD_NEW_PYTHON_SUPPORT} ' + 
            '-D WITH_V4L=${WITH_V4L} ' + 
            '-D ENABLE_PRECOMPILED_HEADERS=${ENABLE_PRECOMPILED_HEADERS} ' + 
            '-D INSTALL_C_EXAMPLES=${INSTALL_C_EXAMPLES} ' + 
            '-D INSTALL_PYTHON_EXAMPLES=${INSTALL_PYTHON_EXAMPLES} ' + 
            '-D BUILD_EXAMPLES=${BUILD_EXAMPLES} ' + 
            '-D WITH_QT=${WITH_QT} ' + 
            '-D WITH_OPENGL=${WITH_OPENGL} ' +
            extraModules ? `-D OPENCV_EXTRA_MODULES_PATH=./opencv_contrib-${version}/modules ` : ''
        );

        await exec.exec(`make -j10 -C opencv-${version}/build`);
        await exec.exec(`sudo make -C opencv-${version}/build install`);
        
        // Clean up?
        await exec.exec(`rm -rf opencv-${version}`);
        await exec.exec(`rm -rf opencv_contrib-${version}`);

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();