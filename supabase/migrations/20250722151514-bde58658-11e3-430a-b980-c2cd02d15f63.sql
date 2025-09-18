-- Remove duplicated plans keeping only the ones with higher prices (the correct ones)
-- Delete the lower-priced duplicates for each employee range

-- For 1-5 employees: keep the one with 299.9 monthly price
DELETE FROM plans WHERE id IN ('83922970-702f-4832-8e6e-283ca71c25e8', '158023e9-55b2-4fbb-9e97-4e116513f7a0');

-- For 6-10 employees: keep the one with 499.9 monthly price  
DELETE FROM plans WHERE id = 'e0e18a35-0be2-4670-afbc-59526754a227';

-- For 11-20 employees: keep the one with 799.9 monthly price
DELETE FROM plans WHERE id = 'bde8879e-c0ee-49ba-aa0d-f38ece7b8ec2';

-- For 21-50 employees: keep the one with 1299.9 monthly price
DELETE FROM plans WHERE id IN ('a14c7efa-a0ee-4eba-9ccd-27a3fe962378', 'f76b2327-c2ee-41ef-955e-a7c8dca39443');

-- For 51-100 employees: keep the one with 2499.9 monthly price
DELETE FROM plans WHERE id IN ('8ea39947-4ed2-418e-87ce-e162c4458e09', 'f7f59787-9f35-452d-8747-92cb803bbbb3');

-- For 101-200 employees: keep the one with 4999.9 monthly price
DELETE FROM plans WHERE id IN ('0c7406d9-d8ef-4ba0-99c7-e2fc50aaeb06', '1a201603-c162-4f2a-8d85-6afd3c35cae6');