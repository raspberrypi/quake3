#!/bin/sh

# set STAGING to a location holding an image for the ARM Linux root file system
[ -z "$STAGING" ] && STAGING=../../../../MEEGO
# OR set ARM_LIBS to a directory containing the ARM shared libraries
[ ! -z "$ARM_LIBS" ] || ARM_LIBS="$STAGING/usr/lib"

[ CROSS_COMPILE=arm-none-linux-gnueabi-

make ARCH=arm CC=${CROSS_COMPILE}gcc USE_CURL=0 USE_OPENAL=0 CFLAGS="-DVCMODS_MISC -DVCMODS_NOSDL -DVCMODS_OPENGLES -DVCMODS_DEPTH -DVCMODS_STARTKHRONOS -DVCMODS_REPLACETRIG -I$ARM_LIBS/ -I../../../../interface/khronos/" LDFLAGS="-shared -L$ARM_LIBS/"
