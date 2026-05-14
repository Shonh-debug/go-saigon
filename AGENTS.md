# Google Maps Analytics Project

## Project Goal

Build a deployable dashboard, likely pushed to Vercel, that analyzes the user's recent Google Maps activity for places in Ho Chi Minh City.

The dashboard should show:

- Recently viewed or searched places in Ho Chi Minh City.
- What each place is: restaurant, night club, market, school, sports field, gym, shopping mall, etc.
- Where the places are clustered within the city.
- Popularity signals from Google Maps, especially rating and review count.
- Category-level analytics, such as food/nightlife vs shopping vs sports/fitness vs education/campus-adjacent places.
- Updates over time as the user searches for new Ho Chi Minh City places.

The long-term direction is an automated pipeline:

1. Connect to Google Maps / logged-in Maps context.
2. Pull the user's recent Ho Chi Minh City Maps recents.
3. Enrich each place with Google Maps place details.
4. Store or cache normalized place records.
5. Render analytics in a Vercel-hosted dashboard.
6. Add skills/automations so the dashboard can refresh when new places are searched.

## Current Data Context

On May 12, 2026, the user's Google Maps Recents panel showed a Ho Chi Minh City bucket with 43 places from the last 3 days.

The strongest pattern was practical exploration in and around District 7 / Tan Hung, especially near RMIT, Ton Duc Thang University, Nguyen Huu Tho, Nguyen Van Linh, and D1/D6 streets. There was also a central District 1 / Ben Thanh / Dong Khoi / Nguyen Trai lifestyle cluster focused on food, nightlife, shopping, and markets.

This looked less like pure tourism browsing and more like evaluating places the user might actually spend time: eating, shopping, working out, playing sports, studying, or navigating campus-adjacent areas.

## Recent Ho Chi Minh City Places

### Food, Cafes, And Nightlife

- Bodega Saigon: night club at 2 Thi Sách, District 1 area. Rating 4.7, about 1,275 reviews.
- Banana Mama Rooftop Bar & Kitchen Saigon: rooftop restaurant/bar on Cống Quỳnh, Bến Thành area. Rating 4.7, about 2,152 reviews.
- Neighborhood Saigon: restaurant on Nam Quốc Cang, Bến Thành area. Rating 4.0, about 94 reviews.
- Bún chả Hà Nội - Phú Mỹ Hưng: Vietnamese restaurant on Cao Triều Phát, Tân Hưng/Phú Mỹ Hưng area. Rating 3.9, about 2,532 reviews.
- Quán Nhà: restaurant. Rating 4.8, about 2,003 reviews.
- Phở SOL - HẢI TRIỀU: Vietnamese restaurant. Rating 4.4, about 1,447 reviews.
- PHỞ 24 - 158D PASTEUR: pho restaurant. Rating 4.1, about 1,165 reviews.
- Eddie's (District 1) New York Deli & Diner: American restaurant. Rating 4.6, about 2,345 reviews.
- Daddy Cool: American restaurant. Rating 4.1, about 427 reviews.
- Bánh Canh Tây Ninh 25k: restaurant. Rating 5.0, about 5 reviews.
- Bò Né Thanh Tuyền: restaurant. Rating 4.5, about 915 reviews.
- Bò Né Xíu Mại Sài Gòn: restaurant. Rating 4.9, about 511 reviews.
- Three O'Clock: coffee shop. Rating 4.1, about 1,295 reviews.
- Cheho Tea: coffee shop. Rating 3.8, about 140 reviews.

### Shopping, Markets, And Retail

- Sài Gòn Square: shopping/market-style retail destination near Nam Kỳ Khởi Nghĩa, Bến Thành. Rating 4.0, about 9,038 reviews.
- Ben Thanh Market: major market. Rating 4.0, about 82,763 reviews.
- Ben Thanh Mart: market. Rating 3.7, about 32 reviews.
- Cửa Tây Chợ Bến Thành: night market / market entrance area. Rating 4.6, about 93 reviews.
- The New Playground: clothing store / fashion retail. Rating 4.3, about 1,659 reviews.
- The new Playground Đồng Khởi: clothing store. Rating 4.3, about 16 reviews.
- Boss Saigon Centre: clothing store. Rating 3.6, about 17 reviews.
- Mozaic Space: clothing store. Rating 4.8, about 373 reviews.
- H&M: clothing store. Rating 3.8, about 1,815 reviews.
- Crocs Việt Nam Chính Hãng - Nguyễn Trãi: shoe store. Rating 4.8, about 34 reviews.
- THE AIR SAIGON: shoe store. Rating 4.9, about 78 reviews.
- The Locker Room - Retro Football Jersey Shop: football jersey / costume store. Rating 5.0, about 190 reviews.
- MUJI Le Thanh Ton (Flagship store): home goods store. Rating 4.4, about 1,292 reviews.
- Vincom Center Dong Khoi: shopping mall. Rating 4.5, about 12,793 reviews.
- Centre Mall Võ Văn Kiệt (Satra Võ Văn Kiệt): shopping mall. Rating 4.3, about 501 reviews.

### Campus, Education, And Schools

- Đại học RMIT Việt Nam - Cơ sở Nam Sài Gòn: private university at 702 Nguyễn Văn Linh, Tân Hưng. Rating 4.4, about 735 reviews.
- RMIT Vietnam Academic Building 2: university building at the RMIT South Saigon campus. Rating 4.6, about 94 reviews.
- VFIS School Trường quốc tế Việt Nam - Phần Lan: international school near D1/Nguyễn Hữu Thọ, Tân Hưng.
- Ký túc xá Đại học Tôn Đức Thắng: student dormitory at 19 Nguyễn Hữu Thọ, Tân Hưng. Rating 4.6, about 309 reviews.
- Trung tâm Tiếng Trung, Nhật, Hàn (SDTC - Trường Đại học Tôn Đức Thắng): school/language center at 19 Nguyễn Hữu Thọ, Tân Hưng. Rating 4.8, about 21 reviews.

### Sports, Fitness, And Recreation

- RMIT University outdoor sports fields: soccer/athletic fields at RMIT South Saigon. Rating 4.6, about 68 reviews.
- RMIT University Football Pitch: football pitch associated with the RMIT outdoor fields.
- RMIT Tennis Court: tennis court in the RMIT area. Rating 5.0, about 2 reviews.
- Sân bóng đá Hiếu Hoàng Long: soccer field in Bình Hưng. Rating 4.0, about 605 reviews.
- Sân bóng mini Trường ĐH Cảnh Sát Nhân Dân: mini football field in Tân Hưng.
- Ton Duc Thang University Outdoor Stadium: stadium/sports complex near Đường D6, Tân Hưng. Rating 4.7, about 302 reviews.
- Sân Bóng Đá Đại Long 2: soccer field. Rating 4.3, about 23 reviews.
- Flash Fitness - Him Lam: gym. Rating 4.8, about 18 reviews.
- CITIGYM (Sunrise): gym / gymnastics center. Rating 4.2, about 771 reviews.
- ODIN Game Station Q7: internet shop / gaming venue. Rating 4.9, about 896 reviews.
- Vietopia: theme park / children-oriented activity venue. Rating 4.2, about 3,160 reviews.

### Roads, Neighborhoods, And Navigation Targets

- Tan Hung, Ho Chi Minh City: neighborhood/sublocality.
- Đường D1: route in Tân Hưng.
- Đường D6: route in Tân Hưng.
- 72 Đường Số 20: address-level item.
- One Living: recurring map/street-view target around Tân Hưng; verify exact place type before using it as a normalized POI.

## Refresh Notes

### May 12, 2026 Automation Refresh

- The Google Maps Recents Ho Chi Minh City bucket showed 46 places after the browser policy was updated to allow Google Maps access.
- Added new persistent dashboard records for: Crescent Mall; Aeon Shopping Mall - Tan Phu; Phở Khoái; Công Viên Cây Xanh Tân Phong; Công viên HimLam; Trường Đại Học Cảnh Sát; Toà D Đại học Tôn Đức Thắng; Canadian International School; Havana Pickleball; Ton Duc Thang University Gymnasium; Dai Hoc Canh Sat Nhan Dan Football Field; Đại Học Cảnh Sát Nhân Dân; Pho Le; Panda Grill Zone; Whose Studio.
- Treated already-recorded or previously-noted alternates as duplicates, including Đại học RMIT Việt Nam - Cơ sở Nam Sài Gòn, VFIS School, Sân bóng đá Hiếu Hoàng Long, The Locker Room, Ký túc xá Đại học Tôn Đức Thắng, 72 Đường Số 20, The new Playground Đồng Khởi, and Sân Bóng Đá Đại Long 2.

### May 14, 2026 Automation Refresh

- The live Google Maps Recents Ho Chi Minh City bucket showed 46 places in the user's signed-in Chrome Maps tab.
- Added new persistent dashboard records for: Công trường Quách Thị Trang; BỆNH VIỆN MẮT TPHCM - Cổng số 2; Nhà thuốc Bệnh viện Mắt; La Vela Saigon Hotel; PASTA CLUB Not so Italian; KTV 700 Trần Hưng Đạo Phường 2 Quận 5; 호치민 가라오케 원투 KTV KARAOKE 더원; Bam; Pizza 4P's Cobi Tower; Quán Ăn Phú Ký; Cơm Tấm Dì Út; Cơm tấm Nguyễn Văn Cừ; Phở Phú Vương | Phở Ngon Quận 5; TBG Arena - Artificial Football Field 5 & 7 people; Le Football City; D7 Sports Park; SSA Sports Center.
- Added a Services dashboard category for the hospital, pharmacy, and hotel recents, and widened the dashboard map bounds to cover the broader Ho Chi Minh City spread now visible in recents.

## Implementation Notes For Future Agents

- Prefer reading the user's live Google Maps Recents panel through Chrome when account-specific recents are needed.
- The Google Maps connector currently works well for place enrichment through text search and details, but it does not directly expose the user's private Maps recents.
- When filtering history, do not rely only on browser history URLs. Some URLs contain Ho Chi Minh viewport coordinates while the actual target is elsewhere. Prefer the live Maps Recents panel or target place coordinates/details.
- Normalize duplicate names and truncated names before storing data.
- Use Google Maps review count and rating as popularity signals. Review count is especially useful for comparing places across categories.
- Preserve category/type arrays from Google Maps, but map them into dashboard-friendly groups such as Food & Nightlife, Shopping, Campus & Education, Sports & Fitness, Services, and Navigation.
- Treat the dashboard as a real product surface, not a landing page. The first screen should be the analytics experience itself.
- If building with Next.js/Vercel, keep environment variables for any API keys or connector tokens out of committed files.
- The dashboard should be designed to refresh from a repeatable data extraction/enrichment flow rather than from hardcoded sample data.
