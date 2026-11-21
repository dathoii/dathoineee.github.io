-- ============================================================================
-- Migration 004: Master Avatar & Accessory Pack (8 Avatar tham chiếu + 26 Phụ kiện)
-- Bảo toàn 100% avatar & dữ liệu hiện có, nâng cấp hình ảnh cho ID mẫu cũ
-- và bổ sung đầy đủ ít nhất 6 vật phẩm mỗi nhóm HEAD / WINGS / EFFECTS / OTHER.
-- ============================================================================

insert into public.avatar_assets (
  id, name, category, image_url, description, enabled, scale, position_x, position_y, z_index, is_builtin
) values
-- 8 Avatar Chibi mới từ hình ảnh tham chiếu
('avatar_01', 'Tóc xanh kính cam', 'avatar', 'builtin:avatar_01', 'Nhân vật tóc nhọn xanh dương pha xanh lá, kính tròn cam, hoodie nâu', true, 1.00, 0, 0, 20, true),
('avatar_02', 'Xoăn xanh kính râm', 'avatar', 'builtin:avatar_02', 'Nhân vật tóc xoăn xanh lá, kính râm mắt mèo, áo sọc đen trắng', true, 1.00, 0, 0, 20, true),
('avatar_03', 'Xù hồng đào kính hoa', 'avatar', 'builtin:avatar_03', 'Nhân vật tóc xù hồng đào, kính tròn viền hoa vàng, áo xanh đậm', true, 1.00, 0, 0, 20, true),
('avatar_04', 'Xoăn hồng đậm', 'avatar', 'builtin:avatar_04', 'Nhân vật tóc xoăn hồng đậm, kính chữ nhật, cười tít mắt', true, 1.00, 0, 0, 20, true),
('avatar_05', 'Tóc cam áo hoa tím', 'avatar', 'builtin:avatar_05', 'Nhân vật tóc cam năng động, áo tím họa tiết hoa anh đào', true, 1.00, 0, 0, 20, true),
('avatar_06', 'Tóc cầu vồng chỏm hồng', 'avatar', 'builtin:avatar_06', 'Nhân vật tóc cầu vồng, chỏm tóc dựng màu hồng, khuyên tai tròn', true, 1.00, 0, 0, 20, true),
('avatar_07', 'Tóc vàng kính xanh lá', 'avatar', 'builtin:avatar_07', 'Nhân vật tóc vàng nhọn, kính xanh lá ngộ nghĩnh, áo cam', true, 1.00, 0, 0, 20, true),
('avatar_08', 'Tóc đỏ dài xoăn', 'avatar', 'builtin:avatar_08', 'Nhân vật tóc đỏ dài xoăn, kính nâu vuông, áo khoác vàng xanh', true, 1.00, 0, 0, 20, true),

-- 10 Avatar gốc được bảo toàn
('avatar-dino', 'Khủng long xanh', 'avatar', 'builtin:avatar-dino', 'Avatar Chibi khủng long thân thiện', true, 1.00, 0, 0, 20, true),
('avatar-cat', 'Mèo con tam thể', 'avatar', 'builtin:avatar-cat', 'Avatar Chibi mèo con vui vẻ', true, 1.00, 0, 0, 20, true),
('avatar-green-curly', 'Tóc xoăn xanh', 'avatar', 'builtin:avatar-green-curly', 'Avatar Chibi tóc xoăn xanh lá', true, 1.00, 0, 0, 20, true),
('avatar-blue-glasses', 'Cậu bé kính tròn', 'avatar', 'builtin:avatar-blue-glasses', 'Avatar Chibi tóc xanh đeo kính', true, 1.00, 0, 0, 20, true),
('avatar-bunny', 'Thỏ hồng đáng yêu', 'avatar', 'builtin:avatar-bunny', 'Avatar Chibi thỏ hồng tai dài', true, 1.00, 0, 0, 20, true),
('avatar-blue-shades', 'Kính râm ngầu', 'avatar', 'builtin:avatar-blue-shades', 'Avatar Chibi tóc xanh đeo kính râm', true, 1.00, 0, 0, 20, true),
('avatar-afro-shades', 'Xoăn bồng phong cách', 'avatar', 'builtin:avatar-afro-shades', 'Avatar Chibi tóc xù kính mát', true, 1.00, 0, 0, 20, true),
('avatar-blonde-boy', 'Cậu bé tóc vàng', 'avatar', 'builtin:avatar-blonde-boy', 'Avatar Chibi tóc vàng ngơ ngác', true, 1.00, 0, 0, 20, true),
('avatar-red-glasses', 'Cô nàng tóc đỏ', 'avatar', 'builtin:avatar-red-glasses', 'Avatar Chibi tóc đỏ đeo kính', true, 1.00, 0, 0, 20, true),
('avatar-orange-kimono', 'Tóc cam năng động', 'avatar', 'builtin:avatar-orange-kimono', 'Avatar Chibi tóc cam tươi cười', true, 1.00, 0, 0, 20, true),

-- Nhóm HEAD (8 vật phẩm)
('head-crown', 'Vương miện hoàng gia', 'head', 'builtin:head-crown', 'Vương miện vàng đính ngọc ruby và ngọc lục bảo', true, 0.72, 0, -52, 32, true),
('head_02_crown_pink', 'Vương miện hồng', 'head', 'builtin:head_02_crown_pink', 'Vương miện công chúa hồng đính ngọc trái tim', true, 0.72, 0, -50, 32, true),
('head_03_witch_hat', 'Nón phù thủy', 'head', 'builtin:head_03_witch_hat', 'Nón phù thủy tím chóp nhọn khóa vàng Chibi', true, 0.96, 0, -52, 32, true),
('head-cat-ears', 'Tai mèo dễ thương', 'head', 'builtin:head-cat-ears', 'Băng đô tai mèo kem hồng gắn trên đầu', true, 0.95, 0, -38, 30, true),
('head_05_bunny_ears', 'Tai thỏ trắng', 'head', 'builtin:head_05_bunny_ears', 'Băng đô tai thỏ trắng dài hồng dễ thương', true, 0.95, 0, -48, 30, true),
('head_06_devil_horns', 'Sừng quỷ nhỏ', 'head', 'builtin:head_06_devil_horns', 'Băng đô sừng quỷ đỏ nhỏ tinh nghịch', true, 0.88, 0, -38, 30, true),
('head-detective-hat', 'Nón thám tử', 'head', 'builtin:head-detective-hat', 'Nón thám tử Chibi màu bạc hà', true, 1.02, 0, -42, 32, true),
('head-sunglasses', 'Kính mát thời trang', 'head', 'builtin:head-sunglasses', 'Kính râm đeo ngang mặt nhân vật', true, 0.78, 0, -4, 34, true),

-- Nhóm WINGS (6 đôi cánh đối xứng nằm sau avatar)
('wings-angel', 'Cánh thiên thần trắng', 'wings', 'builtin:wings-angel', 'Đôi cánh thiên thần trắng viền xanh pastel hai bên', true, 1.95, 0, -4, 10, true),
('wings-devil', 'Cánh ác quỷ tím', 'wings', 'builtin:wings-devil', 'Đôi cánh dơi tím phong cách Chibi đối xứng', true, 1.95, 0, -2, 10, true),
('wings-butterfly', 'Cánh bướm nhiều màu', 'wings', 'builtin:wings-butterfly', 'Đôi cánh bướm pastel rực rỡ hai bên', true, 1.85, 0, 0, 10, true),
('wings_04_crystal_fairy', 'Cánh tiên trong suốt', 'wings', 'builtin:wings_04_crystal_fairy', 'Đôi cánh tiên pha lê ngọc lam lấp lánh', true, 1.90, 0, 0, 10, true),
('wings_05_rainbow', 'Cánh cầu vồng', 'wings', 'builtin:wings_05_rainbow', 'Đôi cánh lông vũ bảy sắc cầu vồng rực rỡ', true, 1.95, 0, -2, 10, true),
('wings_06_golden_angel', 'Cánh lông vũ vàng kem', 'wings', 'builtin:wings_06_golden_angel', 'Đôi cánh thiên thần màu vàng kem mềm mại', true, 1.95, 0, -2, 10, true),

-- Nhóm EFFECTS (6 hiệu ứng)
('effects_01_halo', 'Hào quang vàng', 'effects', 'builtin:effects_01_halo', 'Vòng hào quang thiên thần tỏa sáng lấp lánh trên đầu', true, 0.92, 0, -58, 42, true),
('effect-hearts', 'Trái tim bay', 'effects', 'builtin:effect-hearts', 'Vòng trái tim hồng ngọt ngào bay xung quanh avatar', true, 1.48, 0, 0, 40, true),
('effect-sparkles', 'Ngôi sao lấp lánh', 'effects', 'builtin:effect-sparkles', 'Vòng sao pastel tỏa sáng lấp lánh xung quanh avatar', true, 1.50, 0, 0, 40, true),
('effects_04_magic_circle', 'Vòng phép thuật', 'effects', 'builtin:effects_04_magic_circle', 'Vòng ma pháp trăng sao xanh tím huyền ảo', true, 1.42, 0, 0, 40, true),
('effects_05_rainbow', 'Hiệu ứng cầu vồng', 'effects', 'builtin:effects_05_rainbow', 'Cầu vồng pastel cùng hai đám mây bồng bềnh', true, 1.45, 0, -36, 12, true),
('effects_06_confetti', 'Hoa giấy lễ hội', 'effects', 'builtin:effects_06_confetti', 'Hiệu ứng ruy băng lễ hội rực rỡ xung quanh', true, 1.50, 0, 0, 40, true),

-- Nhóm OTHER (6 phụ kiện & thú cưng đồng hành)
('other_01_bow', 'Nơ trang trí', 'other', 'builtin:other_01_bow', 'Nơ lụa hồng san hô cài cổ dễ thương', true, 0.48, 0, 44, 45, true),
('other_02_scarf', 'Khăn choàng', 'other', 'builtin:other_02_scarf', 'Khăn choàng sọc xanh bạc hà ấm áp', true, 0.85, 0, 42, 36, true),
('other-star-badge', 'Huy hiệu ngôi sao', 'other', 'builtin:other-star-badge', 'Huy hiệu ngôi sao vàng mỉm cười Chibi', true, 0.44, 38, 36, 45, true),
('other_04_ghost_pet', 'Bạn đồng hành ma nhỏ', 'other', 'builtin:other_04_ghost_pet', 'Bé ma trắng má hồng bay bên cạnh nhân vật', true, 0.56, -48, 26, 46, true),
('other_05_chick_pet', 'Thú cưng gà con mini', 'other', 'builtin:other_05_chick_pet', 'Bé gà con vàng tròn mũm mĩm đồng hành', true, 0.54, 48, 28, 46, true),
('other-magnifier', 'Kính lúp thám tử', 'other', 'builtin:other-magnifier', 'Kính lúp điều tra gián điệp vui nhộn', true, 0.54, -38, 34, 45, true)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  image_url = excluded.image_url,
  description = excluded.description,
  scale = excluded.scale,
  position_x = excluded.position_x,
  position_y = excluded.position_y,
  z_index = excluded.z_index,
  is_builtin = true;
