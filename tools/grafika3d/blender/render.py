# Render modelu jednostki (GLB z gry) w Blenderze: wygładzenie siatek, skóra z podpowierzchniowym rozpraszaniem, Cycles z miękkim światłem
import bpy, sys, math, mathutils
glb, out, skin = sys.argv[-3], sys.argv[-2], sys.argv[-1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
sk = mathutils.Color([int(skin[i:i + 2], 16) / 255 for i in (1, 3, 5)])
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
# Zlanie brył: skóra (i osobno każda tkanina) w jedną siatkę przez remesh wokselowy + wygładzenie: znikają szwy między kulą głowy,
# szyją, nosem i uszami, przejścia są płynne jak w rzeźbie. Metal, skóra wyprawiona, drewno i oczy zostają ostre, osobno.
import os
if os.environ.get('ZLEJ'):
    def srgb(mt):
        b = mt.node_tree.nodes.get('Principled BSDF') if mt and mt.use_nodes else None
        return ([x ** (1 / 2.2) for x in b.inputs['Base Color'].default_value[:3]], b.inputs['Metallic'].default_value, b.inputs['Roughness'].default_value) if b else (None, 1, 0)
    groups = {}
    for o in meshes:
        if not o.material_slots or not o.material_slots[0].material: continue
        mt = o.material_slots[0].material; c, met, rough = srgb(mt)
        if c is None or met > 0.3 or mt.blend_method != 'OPAQUE': continue
        isskin = sum(abs(c[i] - [sk.r, sk.g, sk.b][i]) for i in range(3)) < 0.12
        if isskin or rough > 0.8: groups.setdefault(mt.name, []).append(o)
    for name, objs in groups.items():
        if len(objs) < 2 and len(objs[0].data.vertices) > 400: continue
        bpy.ops.object.select_all(action='DESELECT')
        for o in objs: o.select_set(True); o.hide_set(False)
        bpy.context.view_layer.objects.active = objs[0]
        bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM'); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        for o in objs: o.modifiers.clear()
        if len(objs) > 1: bpy.ops.object.join()
        o = bpy.context.view_layer.objects.active
        r = o.modifiers.new('rm', 'REMESH'); r.mode = 'VOXEL'; r.voxel_size = float(os.environ.get('VOXEL', 0.006)); r.use_smooth_shade = True
        sm = o.modifiers.new('sm', 'CORRECTIVE_SMOOTH'); sm.iterations = 6; sm.factor = 0.6
        bpy.ops.object.modifier_apply(modifier='rm'); bpy.ops.object.modifier_apply(modifier='sm')
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
for o in meshes:
    for p in o.data.polygons: p.use_smooth = True
    if len(o.data.vertices) < 4000 and not o.modifiers:
        m = o.modifiers.new('sub', 'SUBSURF'); m.levels = m.render_levels = 1
    for ms in o.material_slots:
        mt = ms.material
        if not mt or not mt.use_nodes: continue
        b = mt.node_tree.nodes.get('Principled BSDF')
        if not b: continue
        c = b.inputs['Base Color'].default_value; srgb = [x ** (1 / 2.2) for x in c[:3]]
        if sum(abs(srgb[i] - [sk.r, sk.g, sk.b][i]) for i in range(3)) < 0.12: # skóra
            b.inputs['Subsurface Weight'].default_value = 0.25; b.inputs['Subsurface Radius'].default_value = (0.9, 0.4, 0.25); b.inputs['Subsurface Scale'].default_value = 0.03
            b.inputs['Roughness'].default_value = 0.5
lo = [min(v[i] for o in meshes for v in [o.matrix_world @ mathutils.Vector(c) for c in o.bound_box]) for i in range(3)]
hi = [max(v[i] for o in meshes for v in [o.matrix_world @ mathutils.Vector(c) for c in o.bound_box]) for i in range(3)]
sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.samples = 64; sc.cycles.use_denoising = True; sc.render.film_transparent = True
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Punchy'
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.42, 0.45, 0.52, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.6
def light(name, kind, rot, energy, col):
    l = bpy.data.lights.new(name, kind); l.energy = energy; l.color = col
    if kind == 'SUN': l.angle = math.radians(12)
    o = bpy.data.objects.new(name, l); o.rotation_euler = [math.radians(a) for a in rot]; sc.collection.objects.link(o)
light('key', 'SUN', (50, 0, 60), 4.5, (1, 0.93, 0.82)); light('rim', 'SUN', (60, 0, 200), 3.0, (0.75, 0.82, 1)); light('fill', 'SUN', (75, 0, -40), 0.8, (1, 0.85, 0.7))
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam; cam.data.type = 'ORTHO'
def shot(path, yaw, pitch, cx, cy, cz, size, W, H):
    d = mathutils.Vector((math.sin(yaw) * math.cos(pitch), -math.cos(yaw) * math.cos(pitch), math.sin(pitch)))  # three (x,y,z) -> blender (x,-z,y)
    tgt = mathutils.Vector((cx, cy, cz)); cam.location = tgt + d * 20; cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    cam.data.ortho_scale = size; cam.data.clip_end = 60; sc.render.resolution_x = W; sc.render.resolution_y = H; sc.render.filepath = path; bpy.ops.render.render(write_still=True)
h = hi[2] - lo[2]; mx = (lo[0] + hi[0]) / 2; my = (lo[1] + hi[1]) / 2
shot(out + '_bitwa.png', 0.38, 0.28, mx, my, lo[2] + h * 0.5, h * 1.15, 400, 440)
hd = [o for o in sc.objects if o.name.startswith('head')]; hp = max((o.matrix_world.translation for o in hd), key=lambda v: v.z) if hd else mathutils.Vector((mx, my, hi[2] - h * 0.18))
shot(out + '_portret.png', 1.45, 0.08, hp.x, hp.y, hp.z - 0.12, 1.0, 360, 410)
shot(out + '_twarz.png', 1.3, 0.05, hp.x + 0.05, hp.y, hp.z - 0.02, 0.42, 400, 400)
