# Render klatek jednostki w Blenderze (wywołuje wypal-blender.js): job.json = { w, h, k, ax, ay, yaw, pitch, skin, frames: [{ glb, out }] }.
# Kamera ortogonalna jak G3.render (k pikseli na jednostkę, stopy w punkcie ax, ay), Cycles z odszumianiem, przezroczyste tło.
import bpy, sys, json, math, mathutils
J = json.load(open(sys.argv[-1]))
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.samples = 24; sc.cycles.use_denoising = True; sc.render.film_transparent = True
sc.cycles.max_bounces = 4; sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Punchy'
sc.render.resolution_x, sc.render.resolution_y = J['w'], J['h']
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (0.42, 0.45, 0.52, 1); bg.inputs[1].default_value = 0.6
def light(name, rot, energy, col):
    l = bpy.data.lights.new(name, 'SUN'); l.energy = energy; l.color = col; l.angle = math.radians(12)
    o = bpy.data.objects.new(name, l); o.rotation_euler = [math.radians(a) for a in rot]; sc.collection.objects.link(o)
light('key', (50, 0, 60), 4.5, (1, 0.93, 0.82)); light('rim', (60, 0, 200), 3.0, (0.75, 0.82, 1)); light('fill', (75, 0, -40), 0.8, (1, 0.85, 0.7))
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
def setcam(P):  # kamera jak G3.render; klatka może nadpisać w, h, k, ax, ay, yaw, pitch (portrety)
    yaw, pitch, W, H, k = P['yaw'], P['pitch'], P['w'], P['h'], P['k']; M = max(W, H); sc.render.resolution_x, sc.render.resolution_y = W, H
    d = mathutils.Vector((math.sin(yaw) * math.cos(pitch), -math.cos(yaw) * math.cos(pitch), math.sin(pitch)))  # three (x,y,z) -> blender (x,-z,y)
    cam.location = d * 20; cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    cd = cam.data; cd.type = 'ORTHO'; cd.ortho_scale = M / k; cd.clip_end = 60; cd.shift_x = (W / 2 - P['ax']) / M; cd.shift_y = (P['ay'] - H / 2) / M
setcam(J)
sk = J['skin']; skc = [int(sk[i:i + 2], 16) / 255 for i in (1, 3, 5)] if sk.startswith('#') else None
keep = set(sc.objects)
for f in J['frames']:
    if 'k' in f: setcam({**J, **f})
    if f.get('skin'): sk = f['skin']; skc = [int(sk[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    bpy.ops.import_scene.gltf(filepath=f['glb'])
    for o in sc.objects:
        if o in keep or o.type != 'MESH': continue
        for p in o.data.polygons: p.use_smooth = True
        for ms in o.material_slots:
            mt = ms.material; b = mt.node_tree.nodes.get('Principled BSDF') if mt and mt.use_nodes else None
            if b and skc:
                c = [x ** (1 / 2.2) for x in b.inputs['Base Color'].default_value[:3]]
                if sum(abs(c[i] - skc[i]) for i in range(3)) < 0.12:  # skóra: lekkie rozpraszanie podpowierzchniowe
                    b.inputs['Subsurface Weight'].default_value = 0.25; b.inputs['Subsurface Radius'].default_value = (0.9, 0.4, 0.25); b.inputs['Subsurface Scale'].default_value = 0.03
    sc.render.filepath = f['out']; bpy.ops.render.render(write_still=True)
    for o in list(sc.objects):
        if o not in keep: bpy.data.objects.remove(o, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.textures):
        for x in list(coll):
            if x.users == 0: coll.remove(x)
