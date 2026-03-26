-- Bảng LISTINGS đang có RLS nhưng chỉ cho phép SELECT. 
-- Để các thao tác bán (Insert) và mua (Update) có thể chạy được, cần cấp thêm quyền INSERT và UPDATE:

CREATE POLICY "Allow public insert access to LISTINGS" 
ON public."LISTINGS" FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public update access to LISTINGS" 
ON public."LISTINGS" FOR UPDATE TO public USING (true);
