type ComposedEntityType = "LINK" | "TOKEN" | "PHOTO";
type DraftEntityType = string | ComposedEntityType;

export default {
    formula: "FORMULA" as DraftEntityType,
    image: "IMAGE" as DraftEntityType,
    link: "LINK" as DraftEntityType,
    photo: "PHOTO" as DraftEntityType,
    token: "TOKEN" as DraftEntityType,
};
