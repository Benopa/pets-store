--
-- PostgreSQL database dump
--

\restrict vOkLNfJyT994D2jO2erdmi45QChyaqif5K1vgPhlj6DH2nlroVvjcQoJE2fUEsl

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: animal_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.animal_images (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    url character varying NOT NULL,
    "animalId" uuid,
    "position" integer DEFAULT 0 NOT NULL
);


--
-- Name: animals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.animals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    species character varying,
    description character varying,
    gender character varying,
    "ageMonths" integer,
    price numeric,
    "weightKg" numeric,
    status character varying DEFAULT 'available'::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "categoryId" uuid,
    "ownerId" uuid,
    "moderationStatus" character varying DEFAULT 'approved'::character varying NOT NULL,
    "rejectReason" character varying,
    stock integer DEFAULT 30 NOT NULL,
    "basePrice" numeric,
    "commissionRate" numeric DEFAULT 0 NOT NULL,
    "shopId" uuid
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    type character varying NOT NULL,
    title character varying NOT NULL,
    body character varying,
    "animalId" uuid,
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    items jsonb NOT NULL,
    status character varying DEFAULT 'created'::character varying NOT NULL,
    total numeric,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "userId" uuid,
    address character varying,
    "paymentMethod" character varying,
    "paymentStatus" character varying DEFAULT 'on_delivery'::character varying NOT NULL,
    "cancelReason" character varying
);


--
-- Name: shops; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shops (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    address character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying NOT NULL,
    "passwordHash" character varying NOT NULL,
    role character varying DEFAULT 'buyer'::character varying NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "firstName" character varying,
    "lastName" character varying,
    "birthDate" date,
    address character varying,
    "paymentMethod" character varying,
    avatar character varying,
    favorites jsonb DEFAULT '[]'::jsonb NOT NULL,
    cart jsonb DEFAULT '[]'::jsonb NOT NULL
);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Data for Name: animal_images; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.animal_images (id, url, "animalId", "position") FROM stdin;
ee5cae2f-6832-482f-a8c1-4d44be868aec	/uploads/a9e5f9d6-e964-4f07-ba73-4bc90a5536d2.jpg	39c3d55b-5475-4269-a00f-3e49b1a3552d	0
171b1111-3c43-4d92-9dbf-94dc17fe9101	/uploads/84beaa20-dcd2-484b-961c-f0fa188c32d2.jpg	524e8ba1-be06-4378-a90e-4b6a9c388944	0
718dcdcb-2730-42ad-b47e-88e6c7562304	/uploads/3017465e-7ef8-479f-89df-5695d60b6bea.jpg	524e8ba1-be06-4378-a90e-4b6a9c388944	1
7768913f-a763-4f47-96d1-870744040493	/uploads/2a8f9be8-9532-43e3-9cf2-d3ac42a52c1b.jpg	524e8ba1-be06-4378-a90e-4b6a9c388944	2
5a340477-12a2-47b4-a750-10ce930459f2	/uploads/70daac24-abd6-4c6b-86c7-4fc307279de5.jpg	b48e0144-b06a-47f6-8f41-abe628aa17f8	0
c3a59cc7-4d0f-4c63-aee4-590071646fc7	/uploads/f8e3978b-cded-46c5-8273-062cf0cb971d.jpg	b48e0144-b06a-47f6-8f41-abe628aa17f8	1
d045d585-ceb7-47b2-b0cf-9096eae9eca6	/uploads/d561fe17-79bb-458f-aa9c-0c8c77220c31.jpg	b48e0144-b06a-47f6-8f41-abe628aa17f8	2
dc37dcf9-cf71-4391-ad62-e7616edabd70	/uploads/e400f35d-769d-4500-9d1a-151852f28b9f.jpg	b48e0144-b06a-47f6-8f41-abe628aa17f8	3
207c7217-4e15-44fa-80be-7836d03a7f5b	/uploads/675ee3bc-38f1-4bad-8bb6-37659c2e6de0.jpg	beb3ff0b-4158-4ca0-b2e3-fd514449e78f	0
b21bccb3-1553-4c68-9249-031ffe22e2e4	/uploads/05bbb0b6-cd53-4624-b86a-e6e7004d7291.jpg	beb3ff0b-4158-4ca0-b2e3-fd514449e78f	1
dcf8be9f-48ce-4f4f-a8f2-eb884a33b927	/uploads/49e0bb39-8d4d-4abb-965c-42339a172755.jpg	beb3ff0b-4158-4ca0-b2e3-fd514449e78f	2
06142d6b-fad4-4ea3-a5a7-f78fc72c0dbb	/uploads/3eee1dcb-63c9-4f04-a727-5a4e31d1bccf.jpg	c4c21721-3b81-4f9f-9c12-25360d92909f	0
803bbe5a-8f6d-4107-9977-4751f3482850	/uploads/347db92a-4d93-4e79-acea-c053660a4677.jpg	c4c21721-3b81-4f9f-9c12-25360d92909f	1
f469dd7d-38f1-462c-b33e-85000ea3c5cd	/uploads/9962d645-2c68-459d-a9a3-7212740808cb.jpg	c4c21721-3b81-4f9f-9c12-25360d92909f	2
1a07e4ab-cb27-4e63-9a28-5461a35e25f8	/uploads/3aec689d-f147-4568-8275-cc5622110b5e.jpg	c5bd86ce-639e-4b61-87bd-81d56510ed16	0
2a524c97-1db6-429d-8f05-cefa690094bd	/uploads/3f48bb38-10ac-4a2f-b998-34497e7d5f11.jpg	c5bd86ce-639e-4b61-87bd-81d56510ed16	1
76c95366-e55d-4c03-bec2-bb73a927817b	/uploads/003449ce-f02e-4b65-bed5-604523cda267.jpg	c5bd86ce-639e-4b61-87bd-81d56510ed16	2
6fe93f96-f2c0-4465-a4fa-fa1639b9d638	/uploads/8cf33f54-1760-4128-a1cf-86041589437c.jpg	de4d2f3c-f019-463f-a965-746aa5571ee6	0
0f80615d-909c-4efe-9487-fe69c3fb0df0	/uploads/36e37a65-4e0b-482e-9594-ce0a4f81d6c0.jpg	29012f8e-07dc-43ae-a04f-1105149599af	1
e4ff10e5-2138-4e0a-9792-f903a02cb6f9	/uploads/dc7b4154-d0b3-4185-82be-2ed1746857c4.jpg	29012f8e-07dc-43ae-a04f-1105149599af	0
1c7196eb-081a-4cd4-9a26-f55c5448d27e	/uploads/73ab6f45-a93e-4ee0-be09-35379d51c586.jpg	29012f8e-07dc-43ae-a04f-1105149599af	2
8b236f41-b714-463d-a26d-02c051399983	/uploads/eabc4f88-d942-47a8-8c56-7f21bce53c75.jpg	de4d2f3c-f019-463f-a965-746aa5571ee6	1
e304988c-8cf7-438e-822a-90b13b529302	/uploads/d58fb27e-e4c3-485f-bff9-fe8f73cf5a63.jpg	de4d2f3c-f019-463f-a965-746aa5571ee6	2
35e6da2c-8d2c-4aad-a711-87fb94787371	/uploads/4393114d-20ca-4d8a-b128-988b8e1853d8.jpg	f1098c25-44ee-45f0-be1c-84e62a826986	0
4596948d-564f-4f4c-9c62-a261e9798cf8	/uploads/c7c8f0b6-8790-4bc1-acef-d30c77b3b745.jpg	f1098c25-44ee-45f0-be1c-84e62a826986	1
c19add28-7604-43d9-8f35-46df235462ba	/uploads/a98b3126-17cc-4ee7-b579-56e230165429.jpg	f1098c25-44ee-45f0-be1c-84e62a826986	2
ebef590a-a9f3-40db-876c-ac1af1a2391a	/uploads/61d4b4ad-e26b-4cb0-b542-98e09b26ac0b.jpg	c8fb1c9e-ed8c-405c-bcaa-5c0a17257c04	0
d4990b47-a299-4a6f-9c75-dfed487b1301	/uploads/48dac0d3-fa09-4a2a-b082-03e0c2cba1af.jpg	c8fb1c9e-ed8c-405c-bcaa-5c0a17257c04	1
c18f6a10-b17b-4973-b51d-dabf5dfdbf88	/uploads/d4dc75bf-b4dc-4ac3-80a1-026b013ab85b.jpg	c8fb1c9e-ed8c-405c-bcaa-5c0a17257c04	2
c87f2ae2-959d-463e-b187-8f6f7d461298	/uploads/d025c3dc-3de9-480b-a153-62c4c0a02bd2.jpg	c8fb1c9e-ed8c-405c-bcaa-5c0a17257c04	3
9d5532a9-134e-4ed1-816b-3efe64fcde75	/uploads/7a0c6040-991b-44a3-bc2c-518658a880fc.jpg	27fad26b-e76e-4f6d-b932-e042f3cba6d2	0
44207146-708c-41b5-8369-a00d989997b9	/uploads/2a80e91f-9b50-40c9-b76b-37a9b55b7a9a.jpg	27fad26b-e76e-4f6d-b932-e042f3cba6d2	1
083ad78d-f2a7-435e-9971-2b9b21ac8dc8	/uploads/1a32c0e5-f32d-420e-8cc0-f6cc65532a92.jpg	27fad26b-e76e-4f6d-b932-e042f3cba6d2	2
9d130325-1407-4cbd-b370-4204e2f3ac8c	/uploads/608624e3-f439-4448-8406-f56d2873c6f4.jpg	74f780c2-4072-4ccb-821c-740e3e1682f4	0
69a0eea9-46d2-425a-9af7-3a20df3923f8	/uploads/bdb22761-1dad-4a66-b7be-2e42b3983349.jpg	74f780c2-4072-4ccb-821c-740e3e1682f4	1
4ab26156-2f3e-4cdc-876b-9321ddac1737	/uploads/35694367-919d-4485-9319-1b6a05172b3b.jpg	74f780c2-4072-4ccb-821c-740e3e1682f4	2
0d4c2862-f940-4846-a36d-86f6b9d0fe82	/uploads/cd3bc879-a3d9-455a-a001-6c97f5836812.jpg	74f780c2-4072-4ccb-821c-740e3e1682f4	3
2b247afa-01dc-4106-a046-80827f775e42	/uploads/aa692f08-b8bf-4688-8e29-1d8ccee3ee5b.jpg	84758e12-2dcb-454b-b2f7-310e0d6fa474	0
9da3ace8-1607-43aa-9389-a38b5d86ada9	/uploads/02e722b6-2444-4542-8a5c-75f718ed0e41.jpg	84758e12-2dcb-454b-b2f7-310e0d6fa474	1
5b9eb61b-6507-40d9-b6b1-72ae9bb9628d	/uploads/b48504be-cace-4b85-a106-08fc89258661.jpg	84758e12-2dcb-454b-b2f7-310e0d6fa474	2
8fa0907a-237f-443d-8666-e119bc08060e	/uploads/0c9e44d1-a518-4163-9f5d-3912dda5e117.jpg	24f14345-2d5b-4f72-b490-acab9fc4689e	0
f8d48cdd-5b9c-4e3c-93f3-50a2adbee294	/uploads/e01b135e-3f45-4841-87a2-35510f984844.jpg	24f14345-2d5b-4f72-b490-acab9fc4689e	1
4e3f26a5-847a-4f58-a5b2-1838d8a2f915	/uploads/3424b49a-64ff-46df-b258-5ce79ca8ea87.jpg	24f14345-2d5b-4f72-b490-acab9fc4689e	2
d2ed3fe9-ebef-4ca9-8c26-6959158e8ede	/uploads/df80336b-b3aa-47e9-9894-c4f397cf9be1.jpg	24f14345-2d5b-4f72-b490-acab9fc4689e	3
\.


--
-- Data for Name: animals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.animals (id, name, species, description, gender, "ageMonths", price, "weightKg", status, "createdAt", "categoryId", "ownerId", "moderationStatus", "rejectReason", stock, "basePrice", "commissionRate", "shopId") FROM stdin;
c4c21721-3b81-4f9f-9c12-25360d92909f	PuppyM	Singer 	SKZoo Kim Seungmin	male	12	126.5	4.2	available	2026-03-16 18:15:45.771886	db539c3c-fad0-446e-bf3f-e493457a5d0d	386ec0c2-2f82-4416-a19a-308c6aea7568	approved	\N	29	120.5	0.05	a7a3af0b-fa0a-4adf-80e2-dcf8b5f15195
39c3d55b-5475-4269-a00f-3e49b1a3552d	Tom	labrodor	Friendly cat	male	12	126.5	4.2	available	2026-03-06 08:23:30.976956	b081f46e-00ec-4323-b021-ba7e20c9ec83	386ec0c2-2f82-4416-a19a-308c6aea7568	approved	\N	30	120.5	0.05	a7a3af0b-fa0a-4adf-80e2-dcf8b5f15195
524e8ba1-be06-4378-a90e-4b6a9c388944	Wolf Chan	leader	SKZoo Bang Chan	male	12	126.5	4.2	available	2026-03-16 17:30:18.148556	daabf95b-a61b-48ab-875a-cd0a1421a948	386ec0c2-2f82-4416-a19a-308c6aea7568	approved	\N	30	120.5	0.05	a7a3af0b-fa0a-4adf-80e2-dcf8b5f15195
f1098c25-44ee-45f0-be1c-84e62a826986	Leebit	Dancer	SKZoo Lee Minho	male	12	126.5	4.2	available	2026-03-16 17:49:15.268904	78bfcfaa-339d-4967-af09-f1d17ace1744	386ec0c2-2f82-4416-a19a-308c6aea7568	approved	\N	30	120.5	0.05	a7a3af0b-fa0a-4adf-80e2-dcf8b5f15195
beb3ff0b-4158-4ca0-b2e3-fd514449e78f	Jiniret	Dancer	SKZoo Hwang Hyunjin	male	12	126.5	4.2	available	2026-03-16 17:51:14.008259	78bfcfaa-339d-4967-af09-f1d17ace1744	386ec0c2-2f82-4416-a19a-308c6aea7568	approved	\N	30	120.5	0.05	a7a3af0b-fa0a-4adf-80e2-dcf8b5f15195
b48e0144-b06a-47f6-8f41-abe628aa17f8	FoxI.Ny	Singer 	SKZoo Yang Jeongin	male	12	126.5	4.2	available	2026-03-16 18:17:53.575454	db539c3c-fad0-446e-bf3f-e493457a5d0d	386ec0c2-2f82-4416-a19a-308c6aea7568	approved	\N	30	120.5	0.05	a7a3af0b-fa0a-4adf-80e2-dcf8b5f15195
29012f8e-07dc-43ae-a04f-1105149599af	Dwaekki	Rapper	SKZoo Seo Changbin	male	12	126.5	4.2	available	2026-03-16 18:19:35.546485	daabf95b-a61b-48ab-875a-cd0a1421a948	386ec0c2-2f82-4416-a19a-308c6aea7568	approved	\N	30	120.5	0.05	a7a3af0b-fa0a-4adf-80e2-dcf8b5f15195
c5bd86ce-639e-4b61-87bd-81d56510ed16	Han Quokka	Rapper	SKZoo Han Jisung	male	12	126.5	4.2	available	2026-03-16 17:37:41.104783	daabf95b-a61b-48ab-875a-cd0a1421a948	386ec0c2-2f82-4416-a19a-308c6aea7568	approved	\N	29	120.5	0.05	a7a3af0b-fa0a-4adf-80e2-dcf8b5f15195
27fad26b-e76e-4f6d-b932-e042f3cba6d2	Суни	cat	первый кот Ли Ноу. он забрал его из ветеринарной клиники	\N	\N	233	\N	available	2026-06-24 21:53:09.414149	bd563087-5a06-45fa-a759-8cad07aa568c	c60c8cb2-5ae4-40fa-a02e-805711300120	pending	\N	30	222	0.05	\N
74f780c2-4072-4ccb-821c-740e3e1682f4	Дори	cat	отдали друзья	\N	6	252	\N	available	2026-06-24 21:55:05.071602	bd563087-5a06-45fa-a759-8cad07aa568c	c60c8cb2-5ae4-40fa-a02e-805711300120	pending	\N	30	240	0.05	\N
84758e12-2dcb-454b-b2f7-310e0d6fa474	Дуни	cat	из приюта для животных	\N	5	349	\N	available	2026-06-24 21:55:51.194191	bd563087-5a06-45fa-a759-8cad07aa568c	c60c8cb2-5ae4-40fa-a02e-805711300120	pending	\N	30	333	0.05	\N
c8fb1c9e-ed8c-405c-bcaa-5c0a17257c04	Berry	dog	собака семьи Bang	\N	5	210	\N	available	2026-06-24 21:40:51.260035	b081f46e-00ec-4323-b021-ba7e20c9ec83	9378847f-6cb7-4c7d-8ff9-255b579a4be7	approved	\N	28	200	0.05	\N
24f14345-2d5b-4f72-b490-acab9fc4689e	Kkami	dog	\N	\N	9	189	\N	available	2026-06-24 21:59:18.908942	b081f46e-00ec-4323-b021-ba7e20c9ec83	e68570a3-9cbb-4e80-bef2-3b5093bd195d	approved	\N	27	180	0.05	\N
de4d2f3c-f019-463f-a965-746aa5571ee6	BbokAri	Dancer	SKZoo Lee Felix	male	12	126.5	4.2	available	2026-03-16 17:53:00.592801	78bfcfaa-339d-4967-af09-f1d17ace1744	386ec0c2-2f82-4416-a19a-308c6aea7568	approved	\N	25	120.5	0.05	a7a3af0b-fa0a-4adf-80e2-dcf8b5f15195
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name) FROM stdin;
b081f46e-00ec-4323-b021-ba7e20c9ec83	Dogs
daabf95b-a61b-48ab-875a-cd0a1421a948	3Racha
78bfcfaa-339d-4967-af09-f1d17ace1744	DancerRacha
db539c3c-fad0-446e-bf3f-e493457a5d0d	VocalRacha
bd563087-5a06-45fa-a759-8cad07aa568c	Cats
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
1	1781567000000	InitialSchema1781567000000
2	1781568000000	AddUserProfileFields1781568000000
3	1781569000000	AddUserContactFields1781569000000
4	1781570000000	AddUserFavorites1781570000000
5	1781571000000	AddUserCart1781571000000
6	1781572000000	AddImagePosition1781572000000
7	1781573000000	AddAnimalModeration1781573000000
8	1781574000000	AddShops1781574000000
9	1781575000000	AddNotifications1781575000000
10	1781576000000	AddOrderAddress1781576000000
11	1781577000000	AddAnimalStock1781577000000
12	1781578000000	AddAnimalCommission1781578000000
13	1781579000000	ApplyCommissionToExistingAnimals1781579000000
14	1781580000000	RoundExistingAnimalCommission1781580000000
15	1781581000000	AddOrderPayment1781581000000
16	1781582000000	AddOrderCancelReason1781582000000
17	1781583000000	AddAnimalShop1781583000000
18	1781584000000	AssignAdminAnimalsToShop1781584000000
19	1781585000000	RemoveUserApiKey1781585000000
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, "userId", type, title, body, "animalId", "isRead", "createdAt") FROM stdin;
0cb470f9-c6fb-41c7-bd9f-2b96d4048dea	241b10fa-a087-4971-ad33-218056889a5d	animal_approved	Объявление одобрено	«Kkami» опубликовано в каталоге.	e5813cfe-f12a-47c9-9453-4b77e23cc33e	t	2026-06-22 21:55:34.555157
2f98de22-70ee-4536-9f24-2c55578aabd3	386ec0c2-2f82-4416-a19a-308c6aea7568	order_placed	Новый заказ	Вашего питомца «Dwaekki» заказали.	29012f8e-07dc-43ae-a04f-1105149599af	t	2026-06-24 19:15:23.499833
39e928ad-4a6a-48b5-b5b1-9574c877bfe9	9378847f-6cb7-4c7d-8ff9-255b579a4be7	animal_approved	Объявление одобрено	«Berry» опубликовано в каталоге.	c8fb1c9e-ed8c-405c-bcaa-5c0a17257c04	f	2026-06-24 22:37:38.038327
a8759225-f18e-4990-9029-d7c23ef1c7cd	386ec0c2-2f82-4416-a19a-308c6aea7568	order_placed	Новый заказ	Вашего питомца «Dwaekki» заказали.	29012f8e-07dc-43ae-a04f-1105149599af	t	2026-06-23 08:06:12.73173
4d3f97c9-4187-4d1f-b72a-ee4f9892fd0f	386ec0c2-2f82-4416-a19a-308c6aea7568	order_placed	Новый заказ	Вашего питомца «FoxI.Ny» заказали.	b48e0144-b06a-47f6-8f41-abe628aa17f8	t	2026-06-23 08:06:12.736844
267389c8-1c34-4a82-ab53-fc4a8e044fed	386ec0c2-2f82-4416-a19a-308c6aea7568	order_placed	Новый заказ	Вашего питомца «BbokAri» заказали.	de4d2f3c-f019-463f-a965-746aa5571ee6	t	2026-06-23 18:43:39.63973
8d6c3cc8-9f54-4ea1-84d7-3e7b96087d03	386ec0c2-2f82-4416-a19a-308c6aea7568	order_placed	Новый заказ	Вашего питомца «Dwaekki» заказали.	29012f8e-07dc-43ae-a04f-1105149599af	t	2026-06-23 19:51:53.03286
2242b62f-f9f6-4531-a9db-b0dfdd0838df	386ec0c2-2f82-4416-a19a-308c6aea7568	order_placed	Новый заказ	Вашего питомца «BbokAri» заказали.	de4d2f3c-f019-463f-a965-746aa5571ee6	t	2026-06-24 08:43:55.627888
10aee90c-b852-4bcc-811b-fdca0d833f61	386ec0c2-2f82-4416-a19a-308c6aea7568	order_placed	Новый заказ	Вашего питомца «Dwaekki» заказали.	29012f8e-07dc-43ae-a04f-1105149599af	t	2026-06-24 08:43:55.63301
fe67f0af-5883-4804-a595-749cd5a12483	386ec0c2-2f82-4416-a19a-308c6aea7568	order_placed	Новый заказ	Вашего питомца «Jiniret» заказали.	beb3ff0b-4158-4ca0-b2e3-fd514449e78f	t	2026-06-24 08:43:55.6371
8bcaf6c6-8601-498e-b607-718e216e151d	386ec0c2-2f82-4416-a19a-308c6aea7568	order_placed	Новый заказ	Вашего питомца «Wolf Chan» заказали.	524e8ba1-be06-4378-a90e-4b6a9c388944	t	2026-06-24 22:58:14.313226
2392a0ba-6741-483e-a3b1-170d5e07640e	386ec0c2-2f82-4416-a19a-308c6aea7568	order_placed	Новый заказ	Вашего питомца «Han Quokka» заказали.	c5bd86ce-639e-4b61-87bd-81d56510ed16	t	2026-06-24 22:58:21.749037
5fa06a6b-46fd-4af8-bfee-c24b40b825fa	9378847f-6cb7-4c7d-8ff9-255b579a4be7	animal_approved	Объявление одобрено	«Berry» опубликовано в каталоге.	c8fb1c9e-ed8c-405c-bcaa-5c0a17257c04	f	2026-06-26 00:14:21.996706
b916f86a-f253-4c0c-935e-442445b64b75	386ec0c2-2f82-4416-a19a-308c6aea7568	order_placed	Новый заказ	Вашего питомца «BbokAri» заказали.	de4d2f3c-f019-463f-a965-746aa5571ee6	f	2026-06-26 08:24:53.56996
451a03bb-6bae-4c59-b9c7-8135a4b281c2	386ec0c2-2f82-4416-a19a-308c6aea7568	order_placed	Новый заказ	Вашего питомца «BbokAri» заказали (×3).	de4d2f3c-f019-463f-a965-746aa5571ee6	f	2026-06-26 08:28:17.002657
d1b69804-486a-4eaa-be32-190c0879da12	9378847f-6cb7-4c7d-8ff9-255b579a4be7	order_placed	Новый заказ	Вашего питомца «Berry» заказали (×3).	c8fb1c9e-ed8c-405c-bcaa-5c0a17257c04	f	2026-06-26 08:30:37.843566
8120f68f-49e0-4003-9f53-5ebe8c39ffed	e68570a3-9cbb-4e80-bef2-3b5093bd195d	animal_approved	Объявление одобрено	«Kkami» опубликовано в каталоге.	24f14345-2d5b-4f72-b490-acab9fc4689e	t	2026-06-24 23:54:55.066571
3ff4ea1e-c019-4283-891b-d66da6671820	e68570a3-9cbb-4e80-bef2-3b5093bd195d	order_placed	Новый заказ	Вашего питомца «Kkami» заказали.	24f14345-2d5b-4f72-b490-acab9fc4689e	t	2026-06-24 23:56:34.95012
35c68a85-8faf-463b-b136-ac3958d1b14b	386ec0c2-2f82-4416-a19a-308c6aea7568	order_placed	Новый заказ	Вашего питомца «PuppyM» заказали.	c4c21721-3b81-4f9f-9c12-25360d92909f	f	2026-06-26 15:01:13.920535
95ac390e-b2f3-4926-a4a4-59c7f9ab5918	386ec0c2-2f82-4416-a19a-308c6aea7568	order_placed	Новый заказ	Вашего питомца «BbokAri» заказали.	de4d2f3c-f019-463f-a965-746aa5571ee6	f	2026-06-26 15:01:58.889645
8ef0924d-67e6-43fd-824a-6ce5b75095f8	e68570a3-9cbb-4e80-bef2-3b5093bd195d	order_cancelled	Заказ отменён продавцом	Причина: Закончился товар	\N	t	2026-06-26 23:30:28.427689
57810db1-5b66-4622-aede-c1c7d2571547	9378847f-6cb7-4c7d-8ff9-255b579a4be7	order_placed	Новый заказ	Вашего питомца «Berry» заказали.	c8fb1c9e-ed8c-405c-bcaa-5c0a17257c04	f	2026-06-26 23:38:13.796932
4265c433-34e1-4a3f-ac96-02aa914456c7	e68570a3-9cbb-4e80-bef2-3b5093bd195d	order_shipped	Заказ передан в доставку	Ваш заказ в доставке.	\N	f	2026-06-27 00:04:58.960376
352add64-e908-4f4b-bffb-1c16c693a7c8	e68570a3-9cbb-4e80-bef2-3b5093bd195d	order_placed	Новый заказ	Вашего питомца «Kkami» заказали.	24f14345-2d5b-4f72-b490-acab9fc4689e	t	2026-06-27 14:47:12.917101
b4fb391a-23a8-4262-80c0-8531dd0e0d32	386ec0c2-2f82-4416-a19a-308c6aea7568	order_placed	Новый заказ	Вашего питомца «Han Quokka» заказали.	c5bd86ce-639e-4b61-87bd-81d56510ed16	f	2026-06-28 08:07:33.064495
0e323e57-f6ed-4636-9f67-7dd9170583c7	e68570a3-9cbb-4e80-bef2-3b5093bd195d	order_placed	Новый заказ	Вашего питомца «Kkami» заказали.	24f14345-2d5b-4f72-b490-acab9fc4689e	f	2026-06-28 08:07:33.070351
8a844274-e2be-4f4a-ae44-21e174dca224	9378847f-6cb7-4c7d-8ff9-255b579a4be7	order_ready	Заказ готов к отправке	Продавец подготовил ваш заказ к отправке.	\N	f	2026-06-28 08:08:36.624183
2bf77638-4741-466b-b264-4ce25605af4d	9378847f-6cb7-4c7d-8ff9-255b579a4be7	order_shipped	Заказ передан в доставку	Ваш заказ в доставке.	\N	f	2026-06-28 08:08:52.865992
a215c1cc-2108-4c58-b55d-fcd542dbaa35	386ec0c2-2f82-4416-a19a-308c6aea7568	order_placed	Новый заказ	Вашего питомца «BbokAri» заказали.	de4d2f3c-f019-463f-a965-746aa5571ee6	f	2026-06-28 08:47:53.805
fa6f5d3e-d15d-4482-aa1d-2bc91f76dd72	386ec0c2-2f82-4416-a19a-308c6aea7568	order_placed	Новый заказ	Вашего питомца «BbokAri» заказали.	de4d2f3c-f019-463f-a965-746aa5571ee6	f	2026-06-28 08:50:07.448278
037fae7f-5c9c-4c30-b229-30d7fa0d880a	386ec0c2-2f82-4416-a19a-308c6aea7568	order_placed	Новый заказ	Вашего питомца «BbokAri» заказали.	de4d2f3c-f019-463f-a965-746aa5571ee6	f	2026-06-28 18:37:56.399179
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (id, items, status, total, "createdAt", "updatedAt", "userId", address, "paymentMethod", "paymentStatus", "cancelReason") FROM stdin;
f7ebdac3-4615-4eb0-9c71-98fb66b5cf3c	[{"type": "pet", "itemId": "de4d2f3c-f019-463f-a965-746aa5571ee6", "quantity": 3}]	created	661.5	2026-06-14 18:21:54.208972	2026-06-14 18:21:54.208972	241b10fa-a087-4971-ad33-218056889a5d	\N	\N	on_delivery	\N
f0f26a96-04bc-4e20-8f8b-70d3579e2704	[{"type": "pet", "itemId": "29012f8e-07dc-43ae-a04f-1105149599af", "quantity": 2}]	created	541	2026-06-14 22:57:59.328204	2026-06-14 22:57:59.328204	386ec0c2-2f82-4416-a19a-308c6aea7568	\N	\N	on_delivery	\N
4472fcce-4f89-48eb-90c2-3f555e17cc0b	[{"type": "pet", "itemId": "29012f8e-07dc-43ae-a04f-1105149599af", "quantity": 1}, {"type": "pet", "itemId": "b48e0144-b06a-47f6-8f41-abe628aa17f8", "quantity": 1}]	created	541	2026-06-23 08:06:12.716335	2026-06-23 08:06:12.716335	241b10fa-a087-4971-ad33-218056889a5d	\N	\N	on_delivery	\N
61cd438a-7a75-4f7e-a037-8ecb5d07732e	[{"type": "pet", "itemId": "e5813cfe-f12a-47c9-9453-4b77e23cc33e", "quantity": 1}]	created	399	2026-06-23 18:05:44.639485	2026-06-23 18:05:44.639485	241b10fa-a087-4971-ad33-218056889a5d	\N	\N	on_delivery	\N
ed6452ac-7456-4392-8075-f5d45b656de4	[{"type": "pet", "itemId": "de4d2f3c-f019-463f-a965-746aa5571ee6", "quantity": 1}]	created	420.5	2026-06-23 18:43:39.633237	2026-06-23 18:43:39.633237	241b10fa-a087-4971-ad33-218056889a5d	\N	\N	on_delivery	\N
fc486c42-ad14-4ad9-b8d8-ac5543214539	[{"type": "pet", "itemId": "29012f8e-07dc-43ae-a04f-1105149599af", "quantity": 1}]	created	420.5	2026-06-23 19:51:53.022101	2026-06-23 19:51:53.022101	241b10fa-a087-4971-ad33-218056889a5d	ул. Космонавтов, 44	\N	on_delivery	\N
46967b95-a164-4c57-adcc-863d61efec7e	[{"type": "pet", "itemId": "e5813cfe-f12a-47c9-9453-4b77e23cc33e", "quantity": 1}]	delivered	399	2026-06-24 08:14:20.545305	2026-06-24 08:40:09.467048	241b10fa-a087-4971-ad33-218056889a5d	ул. Космонавтов, 44	\N	on_delivery	\N
7c1a0bd9-675a-40bb-8f2d-cd0547d293d4	[{"type": "pet", "itemId": "de4d2f3c-f019-463f-a965-746aa5571ee6", "quantity": 1}, {"type": "pet", "itemId": "29012f8e-07dc-43ae-a04f-1105149599af", "quantity": 1}, {"type": "pet", "itemId": "beb3ff0b-4158-4ca0-b2e3-fd514449e78f", "quantity": 1}]	created	661.5	2026-06-24 08:43:55.619192	2026-06-24 08:43:55.619192	241b10fa-a087-4971-ad33-218056889a5d	ул. Космонавтов, 44	\N	on_delivery	\N
eb6fd01b-a581-43b2-8625-771f2a47b185	[{"type": "pet", "itemId": "29012f8e-07dc-43ae-a04f-1105149599af", "quantity": 1}]	created	420.5	2026-06-24 19:15:23.485616	2026-06-24 19:15:23.485616	241b10fa-a087-4971-ad33-218056889a5d	ул. Космонавтов, 44	\N	on_delivery	\N
fe8a6df0-9a31-4a44-adae-0256b7d434e8	[{"type": "pet", "itemId": "e5813cfe-f12a-47c9-9453-4b77e23cc33e", "quantity": 1}]	created	399	2026-06-24 19:18:19.988591	2026-06-24 19:18:19.988591	241b10fa-a087-4971-ad33-218056889a5d	ул. Космонавтов, 44	\N	on_delivery	\N
3d9a55f5-14ca-4a68-96c2-22194bd65fb8	[{"type": "pet", "itemId": "524e8ba1-be06-4378-a90e-4b6a9c388944", "quantity": 1}]	created	420.5	2026-06-24 22:58:14.301745	2026-06-24 22:58:14.301745	241b10fa-a087-4971-ad33-218056889a5d	ул. Космонавтов, 44	\N	on_delivery	\N
11dc3c40-b7b7-4a8a-819f-b5dee7a12a40	[{"type": "pet", "itemId": "c5bd86ce-639e-4b61-87bd-81d56510ed16", "quantity": 1}]	created	420.5	2026-06-24 22:58:21.740582	2026-06-24 22:58:21.740582	241b10fa-a087-4971-ad33-218056889a5d	ул. Космонавтов, 44	\N	on_delivery	\N
d07692f8-5d39-48e8-9cf8-147291f2c794	[{"type": "pet", "itemId": "24f14345-2d5b-4f72-b490-acab9fc4689e", "quantity": 1}]	delivered	480	2026-06-24 23:56:34.944336	2026-06-24 23:56:56.105365	c60c8cb2-5ae4-40fa-a02e-805711300120	Сеул	\N	on_delivery	\N
f61cb9a9-6c3a-4531-916a-ec49eb23d3fa	[{"type": "pet", "itemId": "de4d2f3c-f019-463f-a965-746aa5571ee6", "quantity": 1}]	created	436.65	2026-06-26 08:24:53.556269	2026-06-26 08:24:53.556269	e68570a3-9cbb-4e80-bef2-3b5093bd195d	fffff	\N	on_delivery	\N
8ad8a50a-1e99-4785-9808-e597722c3a60	[{"type": "pet", "itemId": "de4d2f3c-f019-463f-a965-746aa5571ee6", "quantity": 3}]	cancelled	709.96	2026-06-26 08:28:16.996243	2026-06-26 14:28:02.17517	e68570a3-9cbb-4e80-bef2-3b5093bd195d	fffff	\N	on_delivery	\N
fbf8947d-029c-4654-acfc-fe374d6c1c14	[{"type": "pet", "itemId": "c4c21721-3b81-4f9f-9c12-25360d92909f", "quantity": 1}]	created	436.5	2026-06-26 15:01:13.90934	2026-06-26 15:01:13.90934	e68570a3-9cbb-4e80-bef2-3b5093bd195d	fffff	\N	on_delivery	\N
231e0370-33d8-4c40-9d8f-27ef3ec515b8	[{"type": "pet", "itemId": "de4d2f3c-f019-463f-a965-746aa5571ee6", "quantity": 1}]	created	436.5	2026-06-26 15:01:58.884126	2026-06-26 15:01:58.884126	241b10fa-a087-4971-ad33-218056889a5d	ул. Космонавтов, 44	\N	on_delivery	\N
823dd320-93c3-43f7-a07c-4f3810a5380e	[{"type": "pet", "itemId": "c8fb1c9e-ed8c-405c-bcaa-5c0a17257c04", "quantity": 3}]	cancelled	680.4	2026-06-26 08:30:37.83395	2026-06-26 23:30:28.426013	e68570a3-9cbb-4e80-bef2-3b5093bd195d	fffff	\N	on_delivery	Закончился товар
780fa9dc-e294-4930-9b6d-8a542d7ca4dc	[{"type": "pet", "itemId": "c8fb1c9e-ed8c-405c-bcaa-5c0a17257c04", "quantity": 1}, {"type": "pet", "itemId": "c5bd86ce-639e-4b61-87bd-81d56510ed16", "quantity": 1}, {"type": "pet", "itemId": "24f14345-2d5b-4f72-b490-acab9fc4689e", "quantity": 1}]	shipped	535.5	2026-06-28 08:07:33.050317	2026-06-28 08:08:52.86414	9378847f-6cb7-4c7d-8ff9-255b579a4be7	сеул	card	paid	\N
b41f8e6b-849b-4b94-8925-4e0bbbf4780d	[{"type": "pet", "itemId": "c8fb1c9e-ed8c-405c-bcaa-5c0a17257c04", "quantity": 1}]	shipped	526	2026-06-26 23:38:13.789061	2026-06-27 00:04:58.958106	e68570a3-9cbb-4e80-bef2-3b5093bd195d	Сеул	card	paid	\N
087a0434-9ada-4059-8327-c90cb366fbb1	[{"type": "pet", "itemId": "24f14345-2d5b-4f72-b490-acab9fc4689e", "quantity": 1}]	created	489	2026-06-27 14:47:12.909062	2026-06-27 14:47:12.909062	9378847f-6cb7-4c7d-8ff9-255b579a4be7	Пусан	card	awaiting	\N
42329808-3148-44c0-a3a2-e27df5193ba1	[{"type": "pet", "itemId": "de4d2f3c-f019-463f-a965-746aa5571ee6", "quantity": 1}]	created	436.5	2026-06-28 08:47:53.79264	2026-06-28 08:47:53.79264	cfc19869-a978-408a-8142-8b9716c895b0	Москва, ул. Пушкина, 1	cash	on_delivery	\N
940471e2-3672-4d6f-ae46-441565cc4530	[{"type": "pet", "itemId": "de4d2f3c-f019-463f-a965-746aa5571ee6", "quantity": 1}]	created	436.5	2026-06-28 08:50:07.438269	2026-06-28 08:50:07.438269	6f2058d8-8075-4886-9659-fcefae987853	Москва, ул. Пушкина, 1	cash	on_delivery	\N
8f6467a2-073b-451f-bc60-6187f70be5d9	[{"type": "pet", "itemId": "de4d2f3c-f019-463f-a965-746aa5571ee6", "quantity": 1}]	created	436.5	2026-06-28 18:37:56.386786	2026-06-28 18:37:56.386786	be90f3fc-d7a8-4b2e-b7a0-49f340d366cc	Москва, ул. Пушкина, 1	cash	on_delivery	\N
\.


--
-- Data for Name: shops; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shops (id, name, address, "createdAt", "updatedAt") FROM stdin;
a7a3af0b-fa0a-4adf-80e2-dcf8b5f15195	SKZoo	Москва	2026-06-27 14:05:02.870534	2026-06-27 14:26:04.491054
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, "passwordHash", role, "createdAt", "updatedAt", "firstName", "lastName", "birthDate", address, "paymentMethod", avatar, favorites, cart) FROM stdin;
9378847f-6cb7-4c7d-8ff9-255b579a4be7	BangChan@stray.kids	$2b$10$dGmUFuxh8fAUjv6wF0GfbOA3.1amAjB2pKT2uXRQzyqSSY1N5zBJK	seller	2026-06-24 19:30:19.990708	2026-06-28 08:08:08.823429	Чан	Бан	1997-10-03	сеул	card	/uploads/d93a8e34-b269-44a2-af16-c7fd0a6fa6b6.jpg	[]	[]
e8b86970-8e7d-4b34-b103-af98610d3f33	user@example.com	$2b$10$3Ksi87h6do04k2en3gomiOoRKOi81PnNS9rf/vLPqOKPSLJeK.roG	buyer	2026-03-16 14:04:38.483486	2026-03-16 14:04:38.483486	\N	\N	\N	\N	\N	\N	[]	[]
6f2058d8-8075-4886-9659-fcefae987853	buyer_1782625802865@test.dev	$2b$10$BP/.A2IjC6j0Z5zQAp5OP.0frzQHxeaw/Oo3ZRuu7aO7c9apRT20m	buyer	2026-06-28 08:50:02.979939	2026-06-28 08:50:07.52438	Тест	Покупатель	1990-01-01	Москва, ул. Пушкина, 1	cash	\N	[]	[]
5d6af3b8-8211-4033-a4e3-e4286b1a6713	test@test.com	$2b$10$0orDn8BUtoG737.2fqYqjOqrwt2fuDFhWVT4SOiI2o9o5jIjlaGWi	buyer	2026-06-13 19:03:47.889914	2026-06-13 19:03:47.889914	Маша 	Петрова	2000-01-01	\N	\N	\N	[]	[]
6a6d47a6-bc6b-435d-861d-9af281e116bc	moder@example.com	$2b$10$Ta6OOZZYwVG4ZJCyT4ePAefwcmSVNIsYuQ4EsdZ3AKVIk29OOQWeS	moderator	2026-06-18 08:01:29.999343	2026-06-18 08:01:29.999343	Анна	\N	\N	\N	\N	\N	[]	[]
241b10fa-a087-4971-ad33-218056889a5d	test@stray.kids	$2b$10$0bR7HsqEnmxXx0E65fVCnOGUkKk1iTmgNUf6eZeWkoyN2hrD5a0MG	seller	2026-06-13 23:52:17.839812	2026-06-26 15:25:57.09952	Маша 	Петрова	2001-01-01	ул. Космонавтов, 44	sbp	/uploads/2f6ac122-f923-4304-9d3f-0d7c58b17b28.jpg	[]	[]
e68570a3-9cbb-4e80-bef2-3b5093bd195d	Huynjin@stray.kids	$2b$10$SUJNuXwCBDdhWUmjx6vfz.jLr6QFA5ydmnV9uD5BfXmFwu6x04L1.	seller	2026-06-24 21:58:00.449873	2026-06-28 07:59:39.195508	Хёнджин	Хван	2000-03-20	Пусан	card	/uploads/e7fa7d81-8a52-4b6d-8bac-e47cda090204.jpg	["beb3ff0b-4158-4ca0-b2e3-fd514449e78f"]	[]
64bb3c32-20b1-49ea-90e4-709170c45881	deliver@example.com	$2b$10$cWpS2LncbR.N8BKtStQUhuwlzXfIAQEiQDOZBarm6pdEqQZ70S5UC	courier	2026-06-28 08:01:34.586457	2026-06-28 08:01:34.586457	Макс	\N	\N	\N	\N	\N	[]	[]
c60c8cb2-5ae4-40fa-a02e-805711300120	LeeKnow@stray.kids	$2b$10$6zwrWx50gDLNj8giMGRJxe9QrxS5WNMkBkojzVDfrU1JD1vjH7ijW	buyer	2026-06-24 21:48:45.047956	2026-06-24 23:56:41.996574	МинХо	Ли	1998-10-25	Сеул	card	/uploads/5681ce8e-7f02-4578-9ce4-d2f85576f351.jpg	[]	[]
da51cb88-f56f-4921-ad27-29001a7fe5af	HanJi-sung@stray.kids	$2b$10$ppjxuGMZwSmg3ghXQfmkceGIfwy7awAEkULqfRKbTuX42.IJGwROO	seller	2026-06-24 22:01:20.265179	2026-06-26 08:22:17.712826	Хан	Джисон	2000-09-14	\N	\N	/uploads/0b83d98c-d9c4-4958-8155-f306f9df495d.jpg	[]	[{"animalId": "c8fb1c9e-ed8c-405c-bcaa-5c0a17257c04", "quantity": 1}, {"animalId": "29012f8e-07dc-43ae-a04f-1105149599af", "quantity": 1}]
77dc060c-b3f7-46d3-af3f-f00e857c91f9	moder@test.com	$2b$10$Uf..ZHUResWiRERFPZw1f.B6ACduYP80OHTm.x/8DQzOS.Q1UA0Za	moderator	2026-06-24 22:12:12.81009	2026-06-24 22:12:12.81009	Саша	\N	\N	\N	\N	\N	[]	[]
cfc19869-a978-408a-8142-8b9716c895b0	buyer_1782625668759@test.dev	$2b$10$CNwp9FuXauQkT.wnDIArbOFh0LfiLSovop4yLW.fSQF4IDPIgywpK	buyer	2026-06-28 08:47:48.910858	2026-06-28 08:47:53.888657	Тест	Покупатель	1990-01-01	Москва, ул. Пушкина, 1	cash	\N	[]	[]
be90f3fc-d7a8-4b2e-b7a0-49f340d366cc	buyer_1782661071862@test.dev	$2b$10$XVokzU1u1L6CiTMs7FtC2O5diQh6r5PlJtKP1ZkUhddEU64buaW7.	buyer	2026-06-28 18:37:51.946512	2026-06-28 18:37:56.493472	Тест	Покупатель	1990-01-01	Москва, ул. Пушкина, 1	cash	\N	[]	[]
386ec0c2-2f82-4416-a19a-308c6aea7568	admin@example.com	$2b$10$dY6lCuEP6n.J0I0bDLMzS.wS.op7S8XKOMCGRiuGhLT4Kp1Z2cP7y	admin	2026-01-22 08:50:37.635983	2026-06-30 21:27:12.071064	Админ	JYP	2001-01-01	москва	card	/uploads/75eced32-534e-4728-9f0d-c31d8995cf8f.jpg	["29012f8e-07dc-43ae-a04f-1105149599af", "f1098c25-44ee-45f0-be1c-84e62a826986"]	[{"animalId": "b48e0144-b06a-47f6-8f41-abe628aa17f8", "quantity": 2}, {"animalId": "de4d2f3c-f019-463f-a965-746aa5571ee6", "quantity": 1}]
\.


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.migrations_id_seq', 19, true);


--
-- Name: categories PK_24dbc6126a28ff948da33e97d3b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY (id);


--
-- Name: animal_images PK_401733200e1009acda47938bbc9; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.animal_images
    ADD CONSTRAINT "PK_401733200e1009acda47938bbc9" PRIMARY KEY (id);


--
-- Name: animals PK_6154c334bbb19186788468bce5c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.animals
    ADD CONSTRAINT "PK_6154c334bbb19186788468bce5c" PRIMARY KEY (id);


--
-- Name: orders PK_710e2d4957aa5878dfe94e4ac2f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: notifications PK_notifications; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "PK_notifications" PRIMARY KEY (id);


--
-- Name: shops PK_shops; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT "PK_shops" PRIMARY KEY (id);


--
-- Name: categories UQ_8b0be371d28245da6e4f4b61878; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE (name);


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: IDX_notifications_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_notifications_user" ON public.notifications USING btree ("userId");


--
-- Name: orders FK_151b79a83ba240b0cb31b2302d1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "FK_151b79a83ba240b0cb31b2302d1" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: animal_images FK_738b0cb56dc6806d29698b95871; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.animal_images
    ADD CONSTRAINT "FK_738b0cb56dc6806d29698b95871" FOREIGN KEY ("animalId") REFERENCES public.animals(id) ON DELETE CASCADE;


--
-- Name: animals FK_aff245fcf7613f3cf77017d0a09; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.animals
    ADD CONSTRAINT "FK_aff245fcf7613f3cf77017d0a09" FOREIGN KEY ("categoryId") REFERENCES public.categories(id);


--
-- Name: animals FK_animals_shop; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.animals
    ADD CONSTRAINT "FK_animals_shop" FOREIGN KEY ("shopId") REFERENCES public.shops(id) ON DELETE SET NULL;


--
-- Name: animals FK_d325f353f4cf75d84c7f4f5ff76; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.animals
    ADD CONSTRAINT "FK_d325f353f4cf75d84c7f4f5ff76" FOREIGN KEY ("ownerId") REFERENCES public.users(id);


--
-- Name: notifications FK_notifications_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "FK_notifications_user" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict vOkLNfJyT994D2jO2erdmi45QChyaqif5K1vgPhlj6DH2nlroVvjcQoJE2fUEsl

