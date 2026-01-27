-- Allow super admin to delete companies
CREATE POLICY "Super admin can delete companies" 
ON public.companies 
FOR DELETE 
USING (is_super_admin());