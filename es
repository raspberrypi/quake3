Index: code/renderer/tr_local.h
===================================================================
--- code/renderer/tr_local.h	(revision 1305)
+++ code/renderer/tr_local.h	(working copy)
@@ -30,8 +30,8 @@
 #include "tr_public.h"
 #include "qgl.h"
 
-#define GL_INDEX_TYPE		GL_UNSIGNED_INT
-typedef unsigned int glIndex_t;
+#define GL_INDEX_TYPE		GL_UNSIGNED_SHORT
+typedef unsigned short glIndex_t;
 
 // fast float to int conversion
 #if id386 && !defined(__GNUC__)
Index: code/renderer/tr_shadows.c
===================================================================
--- code/renderer/tr_shadows.c	(revision 1305)
+++ code/renderer/tr_shadows.c	(working copy)
@@ -124,12 +124,14 @@
 			// if it doesn't share the edge with another front facing
 			// triangle, it is a sil edge
 			if ( hit[ 1 ] == 0 ) {
-				qglBegin( GL_TRIANGLE_STRIP );
-				qglVertex3fv( tess.xyz[ i ] );
-				qglVertex3fv( tess.xyz[ i + tess.numVertexes ] );
-				qglVertex3fv( tess.xyz[ i2 ] );
-				qglVertex3fv( tess.xyz[ i2 + tess.numVertexes ] );
-				qglEnd();
+				glIndex_t indicies[4];
+				indicies[0] = i;
+				indicies[1] = i+tess.numVertexes;
+				indicies[2] = i2;
+				indicies[3] = i2+tess.numVertexes;
+				
+				qglVertexPointer( 3, GL_FLOAT, 16, tess.xyz );
+				qglDrawElements( GL_TRIANGLE_STRIP, 4, GL_INDEX_TYPE, indicies );
 				c_edges++;
 			} else {
 				c_rejected++;
@@ -212,7 +214,7 @@
 	GL_Bind( tr.whiteImage );
 	qglEnable( GL_CULL_FACE );
 	GL_State( GLS_SRCBLEND_ONE | GLS_DSTBLEND_ZERO );
-	qglColor3f( 0.2f, 0.2f, 0.2f );
+	qglColor4f( 0.2f, 0.2f, 0.2f, 1.0f );
 
 	// don't write to the color buffer
 	qglColorMask( GL_FALSE, GL_FALSE, GL_FALSE, GL_FALSE );
@@ -260,6 +262,14 @@
 =================
 */
 void RB_ShadowFinish( void ) {
+	vec3_t quad[4] = {
+		{-100.0f, 100.0f, -10.0},
+		{100.0f, 100.0f, -10.0f},
+		{100.0f, -100.0f, -10.0f},
+		{-100.0f, -100.0f, -10.0f}
+	};
+	glIndex_t indicies[6] = { 0, 1, 2, 0, 3, 2};
+	
 	if ( r_shadows->integer != 2 ) {
 		return;
 	}
@@ -276,18 +286,14 @@
 
     qglLoadIdentity ();
 
-	qglColor3f( 0.6f, 0.6f, 0.6f );
+	qglColor4f( 0.6f, 0.6f, 0.6f, 1.0f );
 	GL_State( GLS_DEPTHMASK_TRUE | GLS_SRCBLEND_DST_COLOR | GLS_DSTBLEND_ZERO );
 
 //	qglColor3f( 1, 0, 0 );
 //	GL_State( GLS_DEPTHMASK_TRUE | GLS_SRCBLEND_ONE | GLS_DSTBLEND_ZERO );
 
-	qglBegin( GL_QUADS );
-	qglVertex3f( -100, 100, -10 );
-	qglVertex3f( 100, 100, -10 );
-	qglVertex3f( 100, -100, -10 );
-	qglVertex3f( -100, -100, -10 );
-	qglEnd ();
+	qglVertexPointer ( 3, GL_FLOAT, 0, quad );
+	qglDrawElements ( GL_TRIANGLE_STRIP, 6, GL_INDEX_TYPE, indicies );
 
 	qglColor4f(1,1,1,1);
 	qglDisable( GL_STENCIL_TEST );
Index: code/renderer/tr_surface.c
===================================================================
--- code/renderer/tr_surface.c	(revision 1305)
+++ code/renderer/tr_surface.c	(working copy)
@@ -291,8 +291,8 @@
 	int	i;
 	vec3_t perpvec;
 	vec3_t direction, normalized_direction;
-	vec3_t	start_points[NUM_BEAM_SEGS], end_points[NUM_BEAM_SEGS];
 	vec3_t oldorigin, origin;
+	vec3_t points[NUM_BEAM_SEGS*2];
 
 	e = &backEnd.currentEntity->e;
 
@@ -317,23 +317,19 @@
 
 	for ( i = 0; i < NUM_BEAM_SEGS ; i++ )
 	{
-		RotatePointAroundVector( start_points[i], normalized_direction, perpvec, (360.0/NUM_BEAM_SEGS)*i );
+		RotatePointAroundVector( points[i*2], normalized_direction, perpvec, (360.0/NUM_BEAM_SEGS)*i );
 //		VectorAdd( start_points[i], origin, start_points[i] );
-		VectorAdd( start_points[i], direction, end_points[i] );
+		VectorAdd( points[i*2], direction, points[i*2+1] );
 	}
 
 	GL_Bind( tr.whiteImage );
 
 	GL_State( GLS_SRCBLEND_ONE | GLS_DSTBLEND_ONE );
 
-	qglColor3f( 1, 0, 0 );
+	qglColor4f( 1.0f, 0.0f, 0.0f, 1.0f );
 
-	qglBegin( GL_TRIANGLE_STRIP );
-	for ( i = 0; i <= NUM_BEAM_SEGS; i++ ) {
-		qglVertex3fv( start_points[ i % NUM_BEAM_SEGS] );
-		qglVertex3fv( end_points[ i % NUM_BEAM_SEGS] );
-	}
-	qglEnd();
+	qglVertexPointer( 3, GL_FLOAT, 0, points );
+	qglDrawArrays( GL_TRIANGLE_STRIP, 0, NUM_BEAM_SEGS*2);
 }
 
 //================================================================================
@@ -905,7 +901,8 @@
 */
 void RB_SurfaceFace( srfSurfaceFace_t *surf ) {
 	int			i;
-	unsigned	*indices, *tessIndexes;
+	unsigned int *indices;
+	glIndex_t	*tessIndexes;
 	float		*v;
 	float		*normal;
 	int			ndx;
@@ -1161,19 +1158,21 @@
 ===================
 */
 void RB_SurfaceAxis( void ) {
+	byte colors[3][4] = { {255,0,0,255},{0,255,0,255},{0,0,255,255}};
+	vec3_t verts[6] = {
+		{0.0f, 0.0f, 0.0f}, {16.0f, 0.0f, 0.0f},
+		{0.0f, 0.0f, 0.0f}, {0.0f, 16.0f, 0.0f},
+		{0.0f, 0.0f, 0.0f}, {0.0f, 0.0f, 16.0f}
+	};
+	glIndex_t indicies[6] = {0, 1, 0, 2, 0, 3};
+
 	GL_Bind( tr.whiteImage );
 	qglLineWidth( 3 );
-	qglBegin( GL_LINES );
-	qglColor3f( 1,0,0 );
-	qglVertex3f( 0,0,0 );
-	qglVertex3f( 16,0,0 );
-	qglColor3f( 0,1,0 );
-	qglVertex3f( 0,0,0 );
-	qglVertex3f( 0,16,0 );
-	qglColor3f( 0,0,1 );
-	qglVertex3f( 0,0,0 );
-	qglVertex3f( 0,0,16 );
-	qglEnd();
+	qglEnableClientState( GL_COLOR_ARRAY );
+	qglColorPointer( 4, GL_UNSIGNED_BYTE, 0, colors );
+	qglVertexPointer( 3, GL_FLOAT, 0, verts );
+
+	qglDrawElements( GL_LINES, 6, GL_INDEX_TYPE, indicies );
 	qglLineWidth( 1 );
 }
 
Index: code/renderer/tr_sky.c
===================================================================
--- code/renderer/tr_sky.c	(revision 1305)
+++ code/renderer/tr_sky.c	(working copy)
@@ -363,25 +363,30 @@
 
 static void DrawSkySide( struct image_s *image, const int mins[2], const int maxs[2] )
 {
-	int s, t;
+	int s, t, i=0;
+	int size;
+	glIndex_t *indicies;
+	
+	size = (maxs[1]-mins[1]) * (maxs[0] - mins[0] + 1);
+	indicies = ri.Hunk_AllocateTempMemory( sizeof(glIndex_t) * size );
 
 	GL_Bind( image );
 
 	for ( t = mins[1]+HALF_SKY_SUBDIVISIONS; t < maxs[1]+HALF_SKY_SUBDIVISIONS; t++ )
 	{
-		qglBegin( GL_TRIANGLE_STRIP );
-
 		for ( s = mins[0]+HALF_SKY_SUBDIVISIONS; s <= maxs[0]+HALF_SKY_SUBDIVISIONS; s++ )
 		{
-			qglTexCoord2fv( s_skyTexCoords[t][s] );
-			qglVertex3fv( s_skyPoints[t][s] );
-
-			qglTexCoord2fv( s_skyTexCoords[t+1][s] );
-			qglVertex3fv( s_skyPoints[t+1][s] );
+			indicies[i++] = t*(SKY_SUBDIVISIONS+1) + s;
+			indicies[i++] = (t+1)*(SKY_SUBDIVISIONS+1) + s;
 		}
-
-		qglEnd();
 	}
+	
+	qglDisableClientState( GL_COLOR_ARRAY);
+	qglEnableClientState( GL_TEXTURE_COORD_ARRAY);
+	qglTexCoordPointer( 2, GL_FLOAT, 0, s_skyTexCoords );
+	qglVertexPointer  ( 3, GL_FLOAT, 0, s_skyPoints );
+	qglDrawElements( GL_TRIANGLE_STRIP, i, GL_INDEX_TYPE, indicies );
+	Hunk_FreeTempMemory(indicies);
 }
 
 static void DrawSkyBox( shader_t *shader )
@@ -816,7 +821,7 @@
 
 	// draw the outer skybox
 	if ( tess.shader->sky.outerbox[0] && tess.shader->sky.outerbox[0] != tr.defaultImage ) {
-		qglColor3f( tr.identityLight, tr.identityLight, tr.identityLight );
+		qglColor4f( tr.identityLight, tr.identityLight, tr.identityLight, 1.0f );
 		
 		qglPushMatrix ();
 		GL_State( 0 );
Index: code/renderer/tr_shade.c
===================================================================
--- code/renderer/tr_shade.c	(revision 1305)
+++ code/renderer/tr_shade.c	(working copy)
@@ -253,7 +253,7 @@
 */
 static void DrawTris (shaderCommands_t *input) {
 	GL_Bind( tr.whiteImage );
-	qglColor3f (1,1,1);
+	qglColor4f (1.0f,1.0f,1.0f,1.0f);
 
 	GL_State( GLS_POLYMODE_LINE | GLS_DEPTHMASK_TRUE );
 	qglDepthRange( 0, 0 );
@@ -288,19 +288,24 @@
 static void DrawNormals (shaderCommands_t *input) {
 	int		i;
 	vec3_t	temp;
+	vec3_t	verts[2*SHADER_MAX_VERTEXES];
+	glIndex_t indicies[2*SHADER_MAX_VERTEXES];
 
+	for (i = 0 ; i < input->numVertexes ; i++) {
+		VectorCopy(input->xyz[i], verts[i*2]);
+		VectorMA (input->xyz[i], 2, input->normal[i], temp);
+		VectorCopy(temp, verts[(i*2)+1]);
+		indicies[(i*2)] = i*2;
+		indicies[(i*2)+1] = (i*2)+1;
+	}
+	
 	GL_Bind( tr.whiteImage );
-	qglColor3f (1,1,1);
+	qglColor4f (1.0f,1.0f,1.0f,1.0f);
 	qglDepthRange( 0, 0 );	// never occluded
 	GL_State( GLS_POLYMODE_LINE | GLS_DEPTHMASK_TRUE );
 
-	qglBegin (GL_LINES);
-	for (i = 0 ; i < input->numVertexes ; i++) {
-		qglVertex3fv (input->xyz[i]);
-		VectorMA (input->xyz[i], 2, input->normal[i], temp);
-		qglVertex3fv (temp);
-	}
-	qglEnd ();
+	qglVertexPointer(3, GL_FLOAT, 0, verts);
+	qglDrawElements( GL_LINES, i, GL_INDEX_TYPE, indicies );
 
 	qglDepthRange( 0, 1 );
 }
@@ -421,7 +426,7 @@
 	byte	clipBits[SHADER_MAX_VERTEXES];
 	float	texCoordsArray[SHADER_MAX_VERTEXES][2];
 	byte	colorArray[SHADER_MAX_VERTEXES][4];
-	unsigned	hitIndexes[SHADER_MAX_INDEXES];
+	glInext_t	hitIndexes[SHADER_MAX_INDEXES];
 	int		numIndexes;
 	float	scale;
 	float	radius;
@@ -574,7 +579,7 @@
 	byte	clipBits[SHADER_MAX_VERTEXES];
 	float	texCoordsArray[SHADER_MAX_VERTEXES][2];
 	byte	colorArray[SHADER_MAX_VERTEXES][4];
-	unsigned	hitIndexes[SHADER_MAX_INDEXES];
+	glIndex_t	hitIndexes[SHADER_MAX_INDEXES];
 	int		numIndexes;
 	float	scale;
 	float	radius;
@@ -1114,6 +1119,10 @@
 	shaderCommands_t *input;
 
 	input = &tess;
+	
+	// if ignoreglerrors is off, qglLockArraysEXT generates a GL error when you
+	// pass it 0 verts
+	if (input->numVertexes == 0 ) return;
 
 	RB_DeformTessGeometry();
 
Index: code/renderer/tr_backend.c
===================================================================
--- code/renderer/tr_backend.c	(revision 1305)
+++ code/renderer/tr_backend.c	(working copy)
@@ -488,7 +488,7 @@
 	// clip to the plane of the portal
 	if ( backEnd.viewParms.isPortal ) {
 		float	plane[4];
-		double	plane2[4];
+		float	plane2[4];
 
 		plane[0] = backEnd.viewParms.portalPlane.normal[0];
 		plane[1] = backEnd.viewParms.portalPlane.normal[1];
@@ -611,9 +611,9 @@
 			//
 			if ( oldDepthRange != depthRange ) {
 				if ( depthRange ) {
-					qglDepthRange (0, 0.3);
+					qglDepthRange (0, 0.3f);
 				} else {
-					qglDepthRange (0, 1);
+					qglDepthRange (0, 1.0f);
 				}
 				oldDepthRange = depthRange;
 			}
@@ -635,7 +635,7 @@
 	// go back to the world modelview matrix
 	qglLoadMatrixf( backEnd.viewParms.world.modelMatrix );
 	if ( depthRange ) {
-		qglDepthRange (0, 1);
+		qglDepthRange (0, 1.0f);
 	}
 
 #if 0
@@ -671,7 +671,7 @@
 	qglScissor( 0, 0, glConfig.vidWidth, glConfig.vidHeight );
 	qglMatrixMode(GL_PROJECTION);
     qglLoadIdentity ();
-	qglOrtho (0, glConfig.vidWidth, glConfig.vidHeight, 0, 0, 1);
+	qglOrtho (0.0f, glConfig.vidWidth, glConfig.vidHeight, 0.0f, 0.0f, 1.0f);
 	qglMatrixMode(GL_MODELVIEW);
     qglLoadIdentity ();
 
@@ -700,6 +700,9 @@
 void RE_StretchRaw (int x, int y, int w, int h, int cols, int rows, const byte *data, int client, qboolean dirty) {
 	int			i, j;
 	int			start, end;
+	vec2_t		texcoords[4];
+	vec2_t		verts[4];
+	glIndex_t	indicies[6] = {0, 1, 2, 0, 3, 2};
 
 	if ( !tr.registered ) {
 		return;
@@ -729,7 +732,7 @@
 	if ( cols != tr.scratchImage[client]->width || rows != tr.scratchImage[client]->height ) {
 		tr.scratchImage[client]->width = tr.scratchImage[client]->uploadWidth = cols;
 		tr.scratchImage[client]->height = tr.scratchImage[client]->uploadHeight = rows;
-		qglTexImage2D( GL_TEXTURE_2D, 0, GL_RGB8, cols, rows, 0, GL_RGBA, GL_UNSIGNED_BYTE, data );
+		qglTexImage2D( GL_TEXTURE_2D, 0, GL_RGBA, cols, rows, 0, GL_RGBA, GL_UNSIGNED_BYTE, data );
 		qglTexParameterf( GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR );
 		qglTexParameterf( GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR );
 		qglTexParameterf( GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP );
@@ -749,18 +752,23 @@
 
 	RB_SetGL2D();
 
-	qglColor3f( tr.identityLight, tr.identityLight, tr.identityLight );
+	qglColor4f( tr.identityLight, tr.identityLight, tr.identityLight, 1.0f );
 
-	qglBegin (GL_QUADS);
-	qglTexCoord2f ( 0.5f / cols,  0.5f / rows );
-	qglVertex2f (x, y);
-	qglTexCoord2f ( ( cols - 0.5f ) / cols ,  0.5f / rows );
-	qglVertex2f (x+w, y);
-	qglTexCoord2f ( ( cols - 0.5f ) / cols, ( rows - 0.5f ) / rows );
-	qglVertex2f (x+w, y+h);
-	qglTexCoord2f ( 0.5f / cols, ( rows - 0.5f ) / rows );
-	qglVertex2f (x, y+h);
-	qglEnd ();
+	verts[0][0] = x;  verts[0][1] = y;
+	verts[1][0] = x+w;  verts[1][1] = y;
+	verts[2][0] = x+w;  verts[2][1] = y+h;
+	verts[3][0] = x;  verts[3][1] = y+h;
+	
+	texcoords[0][0] = 0.5f/cols;      texcoords[0][1] = 0.5f/rows;
+	texcoords[1][0] = (cols-0.5f)/cols;   texcoords[1][1] = 0.5f/rows;
+	texcoords[2][0] = (cols-0.5f)/cols;   texcoords[2][1] = (rows-0.5f)/rows;
+	texcoords[3][0] = 0.5f/cols;      texcoords[3][1] = (rows-0.5f)/rows;
+	
+	qglEnableClientState( GL_TEXTURE_COORD_ARRAY );
+	qglTexCoordPointer( 2, GL_FLOAT, 0, texcoords );
+	qglVertexPointer  ( 2, GL_FLOAT, 0, verts );
+	qglDrawElements( GL_TRIANGLE_STRIP, 6, GL_INDEX_TYPE, indicies );
+	qglDisableClientState( GL_TEXTURE_COORD_ARRAY );
 }
 
 void RE_UploadCinematic (int w, int h, int cols, int rows, const byte *data, int client, qboolean dirty) {
@@ -771,7 +779,7 @@
 	if ( cols != tr.scratchImage[client]->width || rows != tr.scratchImage[client]->height ) {
 		tr.scratchImage[client]->width = tr.scratchImage[client]->uploadWidth = cols;
 		tr.scratchImage[client]->height = tr.scratchImage[client]->uploadHeight = rows;
-		qglTexImage2D( GL_TEXTURE_2D, 0, GL_RGB8, cols, rows, 0, GL_RGBA, GL_UNSIGNED_BYTE, data );
+		qglTexImage2D( GL_TEXTURE_2D, 0, GL_RGBA, cols, rows, 0, GL_RGBA, GL_UNSIGNED_BYTE, data );
 		qglTexParameterf( GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR );
 		qglTexParameterf( GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR );
 		qglTexParameterf( GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP );
@@ -943,6 +951,9 @@
 	image_t	*image;
 	float	x, y, w, h;
 	int		start, end;
+	vec2_t  texcoords[4] = { {0.0f, 0.0f}, {1.0f, 0.0f}, {1.0f, 1.0f}, {0.0f, 1.0f} };
+	vec2_t  verts[4];
+	glIndex_t indicies[6] = { 0, 1, 2, 0, 3, 2};
 
 	if ( !backEnd.projection2D ) {
 		RB_SetGL2D();
@@ -954,6 +965,8 @@
 
 	start = ri.Milliseconds();
 
+	qglEnableClientState( GL_TEXTURE_COORD_ARRAY );
+
 	for ( i=0 ; i<tr.numImages ; i++ ) {
 		image = tr.images[i];
 
@@ -968,19 +981,17 @@
 			h *= image->uploadHeight / 512.0f;
 		}
 
-		GL_Bind( image );
-		qglBegin (GL_QUADS);
-		qglTexCoord2f( 0, 0 );
-		qglVertex2f( x, y );
-		qglTexCoord2f( 1, 0 );
-		qglVertex2f( x + w, y );
-		qglTexCoord2f( 1, 1 );
-		qglVertex2f( x + w, y + h );
-		qglTexCoord2f( 0, 1 );
-		qglVertex2f( x, y + h );
-		qglEnd();
+		verts[0][0] = x;  verts[0][1] = y;
+		verts[1][0] = x+w;  verts[1][1] = y;
+		verts[2][0] = x+w;  verts[2][1] = y+h;
+		verts[3][0] = x;  verts[3][1] = y+h;
+		
+		qglTexCoordPointer( 2, GL_FLOAT, 0, texcoords );
+		qglVertexPointer  ( 2, GL_FLOAT, 0, verts );
+		qglDrawElements( GL_TRIANGLE_STRIP, 6, GL_INDEX_TYPE, indicies );
 	}
 
+	qglDisableClientState( GL_TEXTURE_COORD_ARRAY );
 	qglFinish();
 
 	end = ri.Milliseconds();
