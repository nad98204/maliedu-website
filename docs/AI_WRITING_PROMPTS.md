# Prompt Bo 2 Buoc Cho AI Viet Bai (Cap Nhat Theo Tinh Nang Moi)

Dung theo quy trinh 2 buoc de chat luong cao hon 1 lan prompt.

## Buoc 1 - Tao Outline Va Chien Luoc

```text
Ban la Senior SEO Content Strategist cho Mali Edu.

Du lieu dau vao:
- Muc tieu kinh doanh: {{business_goal}}
- Persona: {{persona}}
- Tu khoa chinh: {{primary_keyword}}
- Tu khoa phu: {{secondary_keywords}}
- Search intent: {{search_intent}}
- CTA: {{cta_goal}}
- Internal links du kien: {{internal_links}}
- Brand voice: {{tone_of_voice}}
- Ghi chu brand/legal: {{brand_rules}}

Yeu cau:
1) De xuat 3 option tieu de bai viet.
2) Tao 1 outline toi uu SEO:
   - H1
   - Mo bai
   - It nhat 3 H2, moi H2 co H3 chi tiet
   - Muc checklist cuoi bai
   - Ket luan + CTA
3) Liet ke muc tieu cua tung section (tai sao section nay can co).
4) Liet ke thong tin con thieu can bo sung tu team (neu co), danh dau [CAN BO SUNG].
5) Tra ve ket qua bang tieng Viet, ro rang, ngan gon.
```

## Buoc 2 - Viet Full Bai Theo Outline Da Chot

```text
Ban la Senior SEO Writer cho Mali Edu.
Hay viet bai hoan chinh theo outline da duyet ben duoi.

Outline duyet:
{{approved_outline}}

Yeu cau dau ra:
1) Noi dung 1500-1800 tu, giong van {{tone_of_voice}}.
2) Khong viet lan man; moi section co gia tri thuc hanh ro rang.
3) Tich hop tu khoa chinh tu nhien:
   - Trong H1
   - Trong 100 tu dau
   - Trong it nhat 1 heading phu
4) Co internal links dang placeholder:
   - [Lien ket 1]
   - [Lien ket 2]
5) Khong bịa so lieu. Neu thieu thong tin, ghi [CAN BO SUNG].
6) Ket thuc bang CTA huong ve {{cta_goal}}.

Tra ve dung format:
- title:
- slug:
- excerpt: (1-2 cau)
- content_html:
- seoTitle: (50-60 ky tu)
- seoDescription: (140-160 ky tu)
- seoKeywords: (5-8 cum, cach nhau dau phay)
- thumbnailAlt:
- relatedPostIdeas: (3 y tuong bai lien quan)
- feedbackCTA: (1-2 cau moi de lai chia se trai nghiem)
- newsletterCTA: (1 cau moi dang ky nhan ban tin)
```

## Prompt Rut Gon Cho Van Hanh Nhanh

```text
Viet bai tin tuc chuan SEO cho Mali Edu voi du lieu:
- Keyword chinh: {{primary_keyword}}
- Doi tuong doc: {{persona}}
- Muc tieu bai: {{business_goal}}
- CTA: {{cta_goal}}

Tra ve:
title, slug, excerpt, content_html, seoTitle, seoDescription, seoKeywords, thumbnailAlt, relatedPostIdeas, feedbackCTA, newsletterCTA.

Rang buoc:
- SeoTitle 50-60 ky tu
- SeoDescription 140-160 ky tu
- Co H2/H3 ro rang
- Khong bịa thong tin
```

## Prompt QA Dau Ra Truoc Khi Dan Vao Admin

```text
Ban la Senior SEO QA.
Kiem tra package bai viet ben duoi truoc khi dan vao AdminPosts.

[PASTE OUTPUT]

Kiem tra:
1) seoTitle 50-60 ky tu
2) seoDescription 140-160 ky tu
3) seoKeywords co 5-8 cum, khong lap y
4) thumbnailAlt ro nghia, lien quan anh bia
5) content_html co H2/H3, checklist va CTA
6) Co feedbackCTA va newsletterCTA phu hop tone thuong hieu
7) Co relatedPostIdeas hop voi chu de bai

Tra ve:
- Danh gia PASS/FAIL tung muc
- Ban da sua cuoi cung, san sang dan vao admin
```
