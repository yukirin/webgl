function faceNormal(v0, v1, v2) {
  const n = new Array();

  // 頂点を結ぶベクトルを算出
  const vec1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
  const vec2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];

  // ベクトル同士の外積
  n[0] = vec1[1] * vec2[2] - vec1[2] * vec2[1];
  n[1] = vec1[2] * vec2[0] - vec1[0] * vec2[2];
  n[2] = vec1[0] * vec2[1] - vec1[1] * vec2[0];

  // 面法線ベクトルを正規化
  const l = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]);
  n[0] /= l;
  n[1] /= l;
  n[2] /= l;

  return n;
}