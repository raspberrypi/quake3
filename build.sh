#!/bin/bash
# this script builds q3 with SDL
# invoke with ./build.sh
# or ./build.sh clean to clean before build


# directory containing the ARM shared libraries (rootfs, lib/ of SD card)
# specifically libEGL.so and libGLESv2.so
ARM_LIBS=`chstage -r`/files/opt/vc/lib

SDL_LIB=/home/demett/sdl/install/lib

# directory containing baseq3/ containing .pk3 files - baseq3 on CD
BASEQ3_DIR="/home/${USER}/"

# VC4 dev tree location
VC4_DIR="../../../.."

# directory to find khronos linux make files (with include/ containing
# headers! Make needs them.)
KHRONOS_DIR="$VC4_DIR/interface/khronos"

# prefix of arm cross compiler installed
CROSS_COMPILE=bcm2708-

# clean
if [ $# -ge 1 ] && [ $1 = clean ]; then
   echo "clean build"
   rm -rf build/*
fi

# sdl not disabled
make -f Makefile COPYDIR="$BASEQ3_DIR" ARCH=arm JOBS=4 \
	CC=""$CROSS_COMPILE"gcc" USE_SVN=0 USE_CURL=0 USE_OPENAL=0 \
	CFLAGS="-DVCMODS_MISC -DVCMODS_OPENGLES -DVCMODS_DEPTH -DVCMODS_REPLACETRIG -DVCMODS_HOSTAPP -I"$ARM_LIBS"/ -I"$KHRONOS_DIR"/include -I"$VC4_DIR" -I"$VC4_DIR"/interface/vmcs_host/linux -I"$VC4_DIR"/interface/vcos/pthreads -I"$VC4_DIR"/interface" \
	LDFLAGS="-L"$ARM_LIBS" -L${SDL_LIB} -lSDL -lvchostif -lvmcs_rpc_client -lbufman -lvcfiled_check -lkhrn_static -lvchiq_arm lvcos -lvcos_generic -lrt"

# copy the required pak3 files over
# cp "$BASEQ3_DIR"/baseq3/*.pk3 "build/release-linux-arm/baseq3/"
exit 0
